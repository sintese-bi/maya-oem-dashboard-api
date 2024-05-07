import WebSocket from "ws";
export class WebSocketService {
  static ws;
  static clientConnection;

  exec(server) {
    WebSocketService.ws = new WebSocket.Server({ server });

    WebSocketService.ws.on("connection", (ws) => {
      console.log("\nconnected\n");
      WebSocketService.clientConnection = ws;
      ws.on("close", () => {
        console.log("\ndisconnected\n");
        WebSocketService.clientConnection = null;
      });
    });
  }

  handleSendingMessage(message) {
    if (!WebSocketService.clientConnection) {
      console.error("No client connection available.");
      return;
    }

    console.log(`\n message: ${message}  \n`);
    WebSocketService.clientConnection.send(message);
  }
}
