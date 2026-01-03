import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return '🚀 Movie Bot is running!';
    
  }

  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
