import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@ApiTags('Sessions')
@Controller()
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post('users/:userId/sessions')
  @ApiOperation({ summary: 'Create a practice session with generated exercises' })
  @ApiResponse({ status: 201, description: 'Created practice session with exercises' })
  @ApiResponse({ status: 400, description: 'Not enough word data to build exercises' })
  createSession(
    @Param('userId') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.service.createSession(userId, dto);
  }

  @Post('sessions/:sessionId/attempts/:exerciseId')
  @ApiOperation({ summary: 'Submit an answer for an exercise' })
  @ApiResponse({ status: 200, description: 'Attempt result with vocabulary status change' })
  @ApiResponse({ status: 400, description: 'Already answered or session completed' })
  @ApiResponse({ status: 404, description: 'Session or exercise not found' })
  submitAttempt(
    @Param('sessionId') sessionId: string,
    @Param('exerciseId') exerciseId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.service.submitAttempt(sessionId, exerciseId, dto);
  }

  @Get('sessions/:sessionId/results')
  @ApiOperation({ summary: 'Get results for a practice session' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Session results with exercise breakdown and vocabulary state' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  getResults(
    @Param('sessionId') sessionId: string,
    @Query('userId') userId: string,
  ) {
    return this.service.getResults(sessionId, userId);
  }
}
