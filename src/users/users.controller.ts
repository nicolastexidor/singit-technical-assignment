import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateVocabularyDto, GetUserInsightsQueryDto } from './dto/update-vocabulary.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get(':userId/insights')
  @ApiOperation({ summary: 'Get user word insights merged with vocabulary state, priority score, and recommendation reason' })
  @ApiResponse({ status: 200, description: 'List sorted by priority score' })
  getUserInsights(
    @Param('userId') userId: string,
    @Query() query: GetUserInsightsQueryDto,
  ) {
    return this.service.getUserInsights(userId, query);
  }

  @Patch(':userId/vocabulary/:insightId')
  @ApiOperation({ summary: 'Manually update a vocabulary status for a word insight' })
  @ApiResponse({ status: 200, description: 'Updated vocabulary entry' })
  @ApiResponse({ status: 404, description: 'Word insight not found' })
  updateVocabulary(
    @Param('userId') userId: string,
    @Param('insightId') insightId: string,
    @Body() dto: UpdateVocabularyDto,
  ) {
    return this.service.updateVocabularyStatus(userId, insightId, dto.status);
  }

  @Get(':userId/summary')
  @ApiOperation({ summary: 'Get vocabulary summary — counts by status, attempt stats, and recommended words' })
  @ApiResponse({ status: 200, description: 'User insight summary' })
  getSummary(@Param('userId') userId: string) {
    return this.service.getSummary(userId);
  }
}
