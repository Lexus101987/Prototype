const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// --- WEB SERVER ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- MINECRAFT BOT ---
function createBot() {
    const bot = mineflayer.createBot({
        host: 'IdontbelieveTheFathe.aternos.me',
        port: 20114, // <--- DOUBLE CHECK THIS PORT ON ATERNOS!
        username: 'Afkbot1',
        version: '1.21.11', // Works for 1.21.x
    });

    bot.on('spawn', () => {
        console.log('Bot is in the server!');
        io.emit('status', 'Online');

        // Anti-AFK Routine: Move every 20 seconds
        setInterval(() => {
            if (bot.entity) {
                bot.swingArm();
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                
                // Randomly look around
                const yaw = Math.random() * Math.PI * 2;
                bot.look(yaw, 0);
            }
        }, 20000);
    });

    bot.on('chat', (username, message) => {
        if (username === bot.username) return;
        io.emit('minecraftChat', { user: username, msg: message });
    });

    bot.on('end', () => {
        console.log('Disconnected. Retrying in 30 seconds...');
        io.emit('status', 'Reconnecting...');
        setTimeout(createBot, 30000); 
    });

    bot.on('error', (err) => {
        console.log('Error:', err.message);
        if(err.message.includes('ECONNRESET')) {
            console.log('--- FIX: Check if "Cracked" is ON in Aternos Options! ---');
        }
    });
}

createBot();

server.listen(port, () => {
  console.log(`\n✅ Dashboard: http://localhost:${port}`);
  console.log(`🚀 Bot is attempting to join Aternos...\n`);
});