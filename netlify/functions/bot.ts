import { Bot } from "grammy"
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"
import OpenAI from "openai"
import { configDotenv } from 'dotenv'
import { getXataClient } from '../../src/xata.js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/index.js'
configDotenv()

const bot = new Bot(process.env.TEL_TOKEN)
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})
const xata = getXataClient()

const initData: ChatCompletionMessageParam[] = [
	{ role: 'system', content: 'you are the master of the game dungeons and dragons.' },
	{ role: 'system', content: 'the game will take place in text dialogue format.' },
	{ role: 'system', content: 'the game will be a short journey from the starting point to the ending point.' },
	{ role: 'system', content: 'the journey will involve one or more players.' },
	{ role: 'system', content: 'you can distinguish players using their IDs.' },
	{ role: 'system', content: 'along the way, players must meet various opponents from the Dungeons and Dragons universe.' },
	{ role: 'system', content: 'there should also be forks in the road along the way, where players will have to choose the further direction of the path.' },
	{ role: 'system', content: 'and there should also be various kinds of obstacles on the way.' },
	{ role: 'system', content: 'players can find various items, for example: a sword, bow, health potion, etc.' },
	{ role: 'system', content: 'please describe the introductory scene of the beginning of the journey, and then conduct the game as the game master.' },
	{ role: 'system', content: 'use russian language only.' },
	{ role: 'system', content: 'translate any other language to the russian language whenever possible.' },
	{ role: 'system', content: 'start new game' }
]

async function getCompletion(messages: ChatCompletionMessageParam[]) {
	const chatCompletion = await openai.chat.completions.create({
		messages: messages,
		model: 'gpt-3.5-turbo'
	})
	return chatCompletion
}

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

async function getAllDialog() {
	const records = await dbGetAll()
	const data = records.map((record) => {
		return {
			role: record.role,
			content: `${record.userId ? 'player ID: ' + record.userId + '; ' : ''}${record.message}`
		}
	})
	return data as ChatCompletionMessageParam[]
}

bot.catch((error) => {
	console.log(error)
})

bot.on('message', async (ctx) => {
	try {
		const message = ctx.message.text.slice(17).trim()

		if (message === '/start') {
			await dbDeleteAll()
			const completion = await getCompletion(initData)
			const record = await dbAddOne({
				role: 'assistant',
				message: completion.choices[0].message.content
			})
			await ctx.reply(`master: ${record.message}`)
			return
		}

		if (message === '/send') {
			const dialog = await getAllDialog()
			const completion = await getCompletion([...initData, ...dialog])
			const record = await dbAddOne({
				role: 'assistant',
				message: completion.choices[0].message.content
			})
			await ctx.reply(`master: ${record.message}`)
			return
		}

		await dbAddOne({
			role: 'user',
			message: message,
			userId: ctx.from.id
		})
		await ctx.reply(`${ctx.from.first_name}: ${message}`)
		return

	} catch (error) {
		console.log(error)
		await ctx.reply('error')
	}
})

// =========================
// bot.start()

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
	try {
		const body = JSON.parse(event.body)

		await bot.init()
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
		console.error('error handler: ', error)
		return { statusCode: 400, body: 'Error was here' }
	}
}

export { handler }



