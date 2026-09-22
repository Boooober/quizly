import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  ParseArrayPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { QuizRequest } from './app.service';
import { AnsweredQuestionDto, NextQuestionResponseDto } from './quiz.dto';

@Controller('quiz')
export class AppController {
  constructor(private readonly app: AppService) {}

  @Post('next')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Next survey question',
    description:
      'Send every question asked so far with the answers the user selected. Send [] to start. Returns the next question, or nextQuestion: null when the survey is complete.',
  })
  @ApiBody({ type: [AnsweredQuestionDto] })
  @ApiOkResponse({ type: NextQuestionResponseDto })
  next(
    @Body(new ParseArrayPipe({ items: AnsweredQuestionDto, whitelist: true }))
    answers: AnsweredQuestionDto[],
  ): Promise<NextQuestionResponseDto> {
    return this.app.nextQuestion(answers);
  }

  @Post()
  @ApiOperation({
    summary: 'Generate a whole quiz for a topic (uses the agent prompt as-is)',
  })
  quiz(@Body() body: QuizRequest) {
    if (!body?.topic?.trim())
      throw new BadRequestException('topic is required');
    return this.app.generateQuiz(body);
  }
}
