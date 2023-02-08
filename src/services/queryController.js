import querymen from 'querymen';
import { reduce, keys } from 'lodash';

export function createQuerymenSchema(mongooseSchema, additionalQueryFilter = {}) {
	return new querymen.Schema(reduce(keys(mongooseSchema.paths), (acc, path) => {
		acc[path] = {
			type: mongooseSchema.paths[path].instance,
			paths: [path]
		}
		return acc
	}, { ...additionalQueryFilter}))
}

