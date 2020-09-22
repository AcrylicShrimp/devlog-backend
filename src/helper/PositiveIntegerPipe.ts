import { Injectable } from '@nestjs/common';
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class PositiveIntegerPipe implements PipeTransform<unknown, number> {
	transform(value: unknown, { data }: ArgumentMetadata): number {
		if (value === undefined)
			throw new BadRequestException(`${data} required`);

		if (typeof value === 'string') value = parseInt(value);

		if (typeof value !== 'number')
			throw new BadRequestException(`${data} must be a integer`);

		const integerValue = Math.round(value);

		if (integerValue < 0)
			throw new BadRequestException(
				`${data} must be a positive(including zero)`
			);

		return integerValue;
	}
}
