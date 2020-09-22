import { Injectable } from '@nestjs/common';
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class StringPipe implements PipeTransform<unknown, string> {
	constructor(
		private max: number = Number.MAX_SAFE_INTEGER,
		private allowEmpty = false
	) {
		if (this.max < 1) this.max = 1;
	}

	transform(value: unknown, { data }: ArgumentMetadata): string {
		if (value === undefined)
			throw new BadRequestException(`${data} required`);

		if (typeof value !== 'string')
			throw new BadRequestException(`${data} must be a string`);

		if (!value.length && !this.allowEmpty)
			throw new BadRequestException(`${data} cannot be empty`);

		if (this.max < value.length)
			throw new BadRequestException(
				`${data} cannot exceed ${this.max} characters long`
			);

		return value;
	}
}
