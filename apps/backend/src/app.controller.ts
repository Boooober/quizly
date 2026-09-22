import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import type { QuizRequest } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly app: AppService) {}

  @Post('quiz')
  quiz(@Body() body: QuizRequest) {
    if (!body?.topic?.trim())
      throw new BadRequestException('topic is required');
    return this.app.generateQuiz(body);
  }
}
