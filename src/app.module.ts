import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InsightsModule } from './insights/insights.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        ({ uri: config.get<string>('MONGO_URI', 'mongodb://localhost:27017/vocab_practice') }),
    }),
    InsightsModule,
    UsersModule,
    SessionsModule,
  ],
})
export class AppModule {}
