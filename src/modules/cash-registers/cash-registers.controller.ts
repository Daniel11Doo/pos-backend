import { Controller } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';

@Controller('cash-registers')
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}
}
