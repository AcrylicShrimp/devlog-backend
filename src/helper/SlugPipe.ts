import { Injectable } from '@nestjs/common';
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

const SlugRegex = /^[a-z0-9][a-z0-9\-]{3,}[a-z0-9]$/;

@Injectable()
export class SlugPipe implements PipeTransform<string, string> {
	transform(value: string, { data }: ArgumentMetadata): string {
		if (!SlugRegex.test(value))
			throw new BadRequestException(`${data} should be a valid slug`);

		return value;
	}
}
