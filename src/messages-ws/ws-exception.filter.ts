import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    let errorMessage = 'Error desconocido';
    let errorType = 'unknown_error';
    let statusCode = 500;

    if (exception instanceof WsException) {
      errorMessage = exception.message;
      errorType = 'ws_exception';
      statusCode = 400;
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      errorType = 'error';
      
      // Detectar errores de validación
      if (exception.message.includes('validation') || exception.message.includes('Validation')) {
        errorType = 'validation_error';
        statusCode = 400;
      }
    }

    this.logger.error(
      `[WS-EXCEPTION] Error en WebSocket - Socket ID: ${client.id}, ` +
      `Tipo: ${errorType}, Mensaje: ${errorMessage}, Data: ${JSON.stringify(data)}`
    );

    // Enviar error al cliente
    client.emit('error', {
      type: errorType,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

