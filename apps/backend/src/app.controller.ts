import {
  Body,
  Controller,
  HttpCode,
  ParseArrayPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import {
  AnsweredQuestionDto,
  NextQuestionResponseDto,
  RecommendationResponseDto,
} from './quiz.dto';

const Answers = () =>
  Body(new ParseArrayPipe({ items: AnsweredQuestionDto, whitelist: true }));

@Controller('quiz')
export class AppController {
  constructor(private readonly app: AppService) {}

  @Post('submit-answer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Next survey question',
    description:
      'Send every question asked so far with the answers the user selected. Send [] to start. Returns the next question, or nextQuestion: null once the agent decides it has enough signal. The funnel has no fixed length; 17 answered questions is a hard backstop. Then call /quiz/recommend.',
  })
  @ApiBody({ type: [AnsweredQuestionDto] })
  @ApiOkResponse({ type: NextQuestionResponseDto })
  submitAnswer(
    @Answers() answers: AnsweredQuestionDto[],
  ): Promise<NextQuestionResponseDto> {
    return this.app.nextQuestion(answers);
  }

  @Post('recommend')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Recommend sunglasses from the catalog',
    description:
      'Send all answered questions. Returns the hero product, two alternatives and personal reasons.',
  })
  @ApiBody({ type: [AnsweredQuestionDto] })
  @ApiOkResponse({ type: RecommendationResponseDto })
  recommend(
    @Answers() answers: AnsweredQuestionDto[],
  ): Promise<RecommendationResponseDto> {
    return this.app.recommend(answers);
  }
}
