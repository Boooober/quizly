import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';

export const QUESTION_TYPES = [
  'binary',
  'multiChoice',
  'singleChoice',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export class QuestionDto {
  @ApiProperty({ example: 'Do you wear glasses every day?' })
  @IsString()
  question: string;

  @ApiProperty({ type: [String], example: ['Yes', 'No'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  answers: string[];

  @ApiProperty({ enum: QUESTION_TYPES, example: 'binary' })
  @IsIn(QUESTION_TYPES)
  typeOfQuestion: QuestionType;
}

export class AnsweredQuestionDto extends QuestionDto {
  @ApiProperty({ type: [String], example: ['Yes'] })
  @IsArray()
  @IsString({ each: true })
  selectedAnswers: string[];
}

export class NextQuestionResponseDto {
  @ApiProperty({
    type: QuestionDto,
    nullable: true,
    description:
      'null when the agent has enough answers and the survey is complete',
  })
  nextQuestion: QuestionDto | null;
}
