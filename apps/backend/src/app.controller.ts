import {
  Body,
  Controller,
  HttpCode,
  ParseArrayPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { AnsweredQuestionDto, NextQuestionResponseDto } from './quiz.dto';

@Controller('quiz')
export class AppController {
  constructor(private readonly app: AppService) {}

  @Post('submit-answer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Next survey question',
    description:
      'Send every question asked so far with the answers the user selected. Send [] to start. Returns the next question, or nextQuestion: null when the survey is complete.',
  })
  @ApiBody({ type: [AnsweredQuestionDto] })
  @ApiOkResponse({ type: NextQuestionResponseDto })
  submitAnswer(
    @Body(new ParseArrayPipe({ items: AnsweredQuestionDto, whitelist: true }))
    answers: AnsweredQuestionDto[],
  ): Promise<NextQuestionResponseDto> {
    return this.app.nextQuestion(answers);
  }
}
