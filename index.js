/* 实例化外部依赖 */
let Koa = require("koa2");
let WebSocket = require("koa-websocket");

/* 实例化 WebSocket, 实例化储存所有上线文数组 并分配监听的端口 */
let app = WebSocket(new Koa());
let conversationList = [];
let outName = '';
app.listen(8200);

function send(opt) {
    conversationList.forEach((conversation, index, conversationList) => {
        conversation.ctx.websocket.send(opt);
    })
}

//create Conversation obj 
function Conversation(ctx) {
    let Conversation = new Object();
    Conversation.ctx = ctx;
    Conversation.name = '';
    return Conversation;
}

/* 实现简单的接发消息 */
app.ws.use((ctx, next) => {
    conversationList.push(Conversation(ctx));
    /*将连接信息存入到数据库中，包括用户名，连接id，时间，消息类型,消息内容*/

    var message = null;
    /*转发所有消息，客户端根据消息类型进行选择性渲染*/
    ctx.websocket.on("message", (opt) => {
        message = JSON.parse(opt);
        if (message.type == 'goOnline') {
            conversationList.forEach((conversation, index, conversationList) => {
                if (conversation.ctx.websocket._ultron.id == ctx.websocket._ultron.id) {
                    conversation.name = message.name;
                }
            })
        }
        send(opt);
    });
    // 下线
    ctx.websocket.on("close", (opt) => {
        for (let i = 0; i < conversationList.length; i++) {
            if (conversationList[i].ctx.websocket.readyState == 2 || conversationList[i].ctx.websocket.readyState == 3) {
                outName = conversationList[i].name;
                conversationList.splice(i, 1);
                i--;
            }
        }
        let _opt = JSON.stringify({
            name: outName,
            type: 'goOutline',
            time: new Date().toLocaleString()
        });
        send(_opt);
    });
});