import { Injectable } from '@nestjs/common';
import { PipeTransform, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class OptionalPipe implements PipeTransform {
	private props: PipeTransform[];

	constructor(...props: PipeTransform[]) {
		this.props = props;
	}

	transform(value: unknown, metadata: ArgumentMetadata): unknown | undefined {
		if (value === undefined || value === null) return undefined;

		for (let index = 0; index < this.props.length; ++index)
			value = this.props[index].transform(value, metadata);

		return value;
	}
}
