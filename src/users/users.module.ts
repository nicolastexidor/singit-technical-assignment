import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserVocabulary, UserVocabularySchema } from './schemas/user-vocabulary.schema';
import { InsightsModule } from '../insights/insights.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserVocabulary.name, schema: UserVocabularySchema }]),
    InsightsModule, // provides WordInsight model + InsightsService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
