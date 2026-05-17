import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { ImportInsightsDto } from './dto/import-insights.dto';
import { GetInsightsQueryDto } from './dto/get-insights-query.dto';

@ApiTags('Insights')
@Controller('insights')
export class InsightsController {
  constructor(private readonly service: InsightsService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import or upsert word insights' })
  @ApiResponse({ status: 200, description: 'Import summary with created/updated/skipped/rejected counts' })
  importInsights(@Body() dto: ImportInsightsDto) {
    return this.service.importInsights(dto.wordInsights);
  }

  @Get()
  @ApiOperation({ summary: 'Get global word insights with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of word insights' })
  findAll(@Query() query: GetInsightsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single word insight by ID' })
  @ApiResponse({ status: 200, description: 'Word insight' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string) {
    const insight = await this.service.findById(id);
    if (!insight) throw new NotFoundException('Word insight not found');
    return insight;
  }
}
