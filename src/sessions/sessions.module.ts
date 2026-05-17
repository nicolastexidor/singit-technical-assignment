import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PracticeSession, PracticeSessionSchema } from './schemas/practice-session.schema';
import { ExerciseAttempt, ExerciseAttemptSchema } from './schemas/exercise-attempt.schema';
import { InsightsModule } from '../insights/insights.module';
import { UsersModule } from '../users/users.module';
import { ExerciseService } from './exercise.service';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeSession.name, schema: PracticeSessionSchema },
      { name: ExerciseAttempt.name, schema: ExerciseAttemptSchema },
    ]),
    InsightsModule, // provides WordInsight model
    UsersModule,    // provides UserVocabulary model + UsersService (vocab updates after attempts)
  ],
  controllers: [SessionsController],
  providers: [ExerciseService, SessionsService],
})
export class SessionsModule {}
