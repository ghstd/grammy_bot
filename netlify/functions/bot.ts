import { Bot } from "grammy"
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"
import OpenAI from "openai"
import { configDotenv } from 'dotenv'
import fs from 'fs'
// import path from 'path'
// import { fileURLToPath } from 'url'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
configDotenv()

const bot = new Bot(process.env.TEL_TOKEN)
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

// async function getCompletion() {
// 	const chatCompletion = await openai.chat.completions.create({
// 		messages: [
// 			{ role: 'user', content: 'Say this is a test' }
// 		],
// 		model: 'gpt-3.5-turbo'
// 	})
// 	console.log(chatCompletion)
// }

bot.catch((error) => {
	console.log(error)
})

bot.on('message', async (ctx) => {
	// fs.writeFileSync(path.resolve(__dirname, '../', '../', 'db.json'), JSON.stringify({
	// 	id: ctx.message.from.id,
	// 	name: ctx.message.from.first_name,
	// 	text: ctx.message.text
	// }))
	// const file = fs.readFileSync(path.resolve(__dirname, '../', '../', 'db.json'), { encoding: 'utf-8' })
	const file = fs.readFileSync('../db.json', { encoding: 'utf-8' })
	const data = JSON.parse(file)
	console.log('data', data)
	await ctx.reply('hello')
})



// =========================
// bot.start()

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
	try {
		const body = JSON.parse(event.body)

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



