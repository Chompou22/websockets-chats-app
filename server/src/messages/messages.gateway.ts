import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

// for some kind of action like make an req to the server by default it will block.
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  // let's be thinks this server as a reference to websocket server.
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('createMessage')
  create(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Create a new message
    const message = this.messagesService.create(createMessageDto, client.id);
    // Broadcast the new message to all connected clients
    this.server.emit('newMessage', message);

    // Log all connected clients
    // const connectedClients = this.server.sockets.sockets;
    // console.log('Connected clients:');
    // connectedClients.forEach((socket) => {
    //   console.log(`Client ID: ${socket.id}`);
    // });

    return message;
  }

  @SubscribeMessage('findAllMessages')
  findAll() {
    return this.messagesService.findAll();
  }

  // check to see who is subscribed or join in group chat.
  @SubscribeMessage('join')
  joinRoom(
    @MessageBody('name') name: string,
    @ConnectedSocket() client: Socket,
  ) {
    return this.messagesService.identify(name, client.id);
  }

  // check to see or tracking who is typing.
  @SubscribeMessage('typing')
  async typing(
    @MessageBody('isTyping') isTyping: boolean,
    @ConnectedSocket() client: Socket,
  ) {
    const name = await this.messagesService.getClientName(client.id);
    client.broadcast.emit('typing', { name, isTyping });
  }
}
