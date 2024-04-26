import { Bot } from "grammy"
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"
import { configDotenv } from 'dotenv'
import { getXataClient } from '../../src/xata.js'
configDotenv()

const bot = new Bot(process.env.TEL_TOKEN)
const xata = getXataClient()

const URL = 'https://grammy-bot-server.onrender.com'

async function dbGetAll() {
	const records = await xata.db.messages
		.select(["id", "role", "message", "userId"])
		.getAll()
	return records
}

async function dbDeleteAll() {
	const records = await dbGetAll()
	const ids = records.map((record) => record.id)
	const deletedRecords = await xata.db.messages.delete(ids)
	return deletedRecords
}

async function dbAddOne(data: { role: string, message: string, userId?: number }) {
	const record = await xata.db.messages.create(data)
	return record
}

async function dbGetAllDialog() {
	const records = await dbGetAll()
	const data = records.map((record) => {
		return {
			role: record.role,
			content: `${record.userId ? 'player ID: ' + record.userId + ' - ' : ''}"${record.message}".`
		}
	})
	return data
}

async function sendToServer(data: { chat_id: number, message_id: number, messages: Array<Record<'role' | 'content', string>> }) {
	const response = await fetch(URL, {
		method: 'POST',
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data)
	})
	const result = await response.json()
	return result
}

bot.catch((error) => {
	console.log(error)
})

bot.on('message', async (ctx) => {
	try {

		const message = ctx.message.text.trim()

		if (message.startsWith('/start')) {

			await dbDeleteAll()
			const msg = await ctx.reply('...Loading')
			const serverResponse = await sendToServer({
				chat_id: msg.chat.id,
				message_id: msg.message_id,
				messages: []
			})
			console.log('in /start', serverResponse)
			return
		}

		if (message.startsWith('/send')) {

			const dialog = await dbGetAllDialog()
			const msg = await ctx.reply('...Loading')
			const serverResponse = await sendToServer({
				chat_id: msg.chat.id,
				message_id: msg.message_id,
				messages: dialog
			})
			console.log('in /send', serverResponse)
			return
		}

		await dbAddOne({
			role: 'user',
			message: message,
			userId: ctx.from.id
		})
		return

	} catch (error) {
		console.log(error)
		await ctx.reply('error')
	}
})


// =========================
// bot.start()

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {

	if (event.httpMethod == 'OPTIONS') {
		console.log('OPTIONS request')
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTION",
			}
		}
	}

	if (!event.body.includes('update_id') && !event.body.includes('myMark')) {
		console.log('unknown event.body === ', event.body)
		return {
			statusCode: 200,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTION",
			}
		}
	}

	try {
		const body = JSON.parse(event.body)

		await bot.init()

		if (body.myMark === 'completion') {
			await dbAddOne({
				role: 'assistant',
				message: body.completion
			})
			await bot.api.editMessageText(body.chat_id, body.message_id, `${body.completion}`)

			return {
				statusCode: 200,
				body: '',
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type",
					"Access-Control-Allow-Methods": "GET, POST, OPTION",
				}
			}
		}

		await bot.handleUpdate(body)
		return {
			statusCode: 200,
			body: '',
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Methods": "GET, POST, OPTION",
			}
		}

	} catch (error) {
		console.error('in Handler', error)
		return { statusCode: 400, body: 'error in Handler' }
	}
}

export { handler }





