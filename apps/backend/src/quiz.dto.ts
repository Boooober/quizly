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

export class ProductDto {
  @ApiProperty({ example: 'sg-01-navigator-polar' })
  id: string;

  @ApiProperty({ example: 'The Coastal Navigator Polarized' })
  title: string;

  @ApiProperty({ example: 149 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({
    example:
      'https://storage.googleapis.com/team3-507508-quizly-images/sg-01-navigator-polar.png',
  })
  imageUrl: string;
}

export class RecommendationResponseDto {
  @ApiProperty({ type: ProductDto })
  hero: ProductDto;

  @ApiProperty({ type: [ProductDto] })
  alternatives: ProductDto[];

  @ApiProperty({
    type: [String],
    description: 'Personal reasons tied to the user answers',
  })
  why: string[];
}
