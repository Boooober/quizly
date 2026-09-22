import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NextQuestionResponseDto } from './quiz.dto';

describe('POST /quiz/next', () => {
  let app: INestApplication<App>;
  const reply: NextQuestionResponseDto = {
    nextQuestion: {
      question: 'Frame shape?',
      answers: ['Round', 'Square'],
      typeOfQuestion: 'singleChoice',
    },
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: { nextQuestion: () => Promise.resolve(reply) },
        },
      ],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });
  afterAll(() => app.close());

  it('rejects an unknown question type', () =>
    request(app.getHttpServer())
      .post('/quiz/next')
      .send([
        {
          question: 'q',
          answers: ['a'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'nope',
        },
      ])
      .expect(400));

  it('rejects a non-array body', () =>
    request(app.getHttpServer())
      .post('/quiz/next')
      .send({ question: 'q' })
      .expect(400));

  it('returns the next question for a valid list', () =>
    request(app.getHttpServer())
      .post('/quiz/next')
      .send([
        {
          question: 'q',
          answers: ['a', 'b'],
          selectedAnswers: ['a'],
          typeOfQuestion: 'binary',
        },
      ])
      .expect(200)
      .expect(reply));
});
