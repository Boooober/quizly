import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NextQuestionResponseDto, RecommendationResponseDto } from './quiz.dto';

describe('POST /quiz/submit-answer', () => {
  let app: INestApplication<App>;
  const reply: NextQuestionResponseDto = {
    nextQuestion: {
      question: 'Frame shape?',
      answers: ['Round', 'Square'],
      typeOfQuestion: 'singleChoice',
    },
    questionNumber: 1,
    totalQuestions: 8,
  };

  const rec: RecommendationResponseDto = {
    hero: {
      id: 'sg-01',
      title: 'Navigator',
      price: 149,
      currency: 'USD',
      imageUrl: 'https://x/1.png',
    },
    alternatives: [],
    why: ['fits'],
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            nextQuestion: () => Promise.resolve(reply),
            recommend: () => Promise.resolve(rec),
          },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('rejects an unknown question type', () =>
    request(app.getHttpServer())
      .post('/quiz/submit-answer')
      .send([
        {
          question: 'q',
          answers: ['a'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'nope',
        },
      ])
      .expect(400));

  it('rejects the retired binary type', () =>
    request(app.getHttpServer())
      .post('/quiz/submit-answer')
      .send([
        {
          question: 'q',
          answers: ['a', 'b'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'binary',
        },
      ])
      .expect(400));

  it('rejects a non-array body', () =>
    request(app.getHttpServer())
      .post('/quiz/submit-answer')
      .send({ question: 'q' })
      .expect(400));

  it('returns the next question for a valid list', () =>
    request(app.getHttpServer())
      .post('/quiz/submit-answer')
      .send([
        {
          question: 'q',
          answers: ['a', 'b'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'singleChoice',
        },
      ])
      .expect(200)
      .expect(reply));

  it('POST /quiz/recommend returns the recommendation for a valid list', () =>
    request(app.getHttpServer())
      .post('/quiz/recommend')
      .send([
        {
          question: 'q',
          answers: ['a', 'b'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'singleChoice',
        },
      ])
      .expect(200)
      .expect(rec));
});
