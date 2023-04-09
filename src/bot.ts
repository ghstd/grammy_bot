import { Bot } from 'grammy';
import { db } from './repo';

const bot = new Bot('');

bot.command('start', (ctx) => {
	if (ctx.from) {
		const id = ctx.from.id;
		const name = ctx.from.first_name;
		// save to db
		// if exist
		db.serialize(() => {
			db.run('')
		})
	}
})

bot.on('message:text', (ctx) => {
	ctx.reply('test')
})








