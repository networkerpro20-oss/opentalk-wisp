import { PartialType } from '@nestjs/swagger';
import { CreateRoutingRuleDto } from './create-routing-rule.dto';

export class UpdateRoutingRuleDto extends PartialType(CreateRoutingRuleDto) {}
