import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsString } from 'class-validator';

export const QUESTION_TYPES = ['singleChoice', 'multiChoice'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export class QuestionDto {
  @ApiProperty({
    example: 'What frustrates you most about sunglasses staying in place?',
  })
  @IsString()
  question: string;

  @ApiProperty({
    type: [String],
    description:
      'singleChoice: 2 to 4 options. multiChoice: exactly 4 options.',
    example: [
      'They slide down my nose constantly',
      'They leave red pinch marks on my nose',
      'They sit too high, above my eyebrows',
      'No issues, they fit fine',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  answers: string[];

  @ApiProperty({ enum: QUESTION_TYPES, example: 'singleChoice' })
  @IsIn(QUESTION_TYPES)
  typeOfQuestion: QuestionType;
}

export class AnsweredQuestionDto extends QuestionDto {
  @ApiProperty({
    type: [String],
    example: ['They slide down my nose constantly'],
  })
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

  @ApiProperty({
    example: 3,
    description:
      '1-based position of nextQuestion in the funnel. Equals the number of questions answered once the survey is complete.',
  })
  questionNumber: number;

  @ApiProperty({
    example: 8,
    description: 'Length of the funnel, so the client can render progress.',
  })
  totalQuestions: number;
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
