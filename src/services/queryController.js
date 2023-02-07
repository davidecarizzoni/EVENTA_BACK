import querymen from 'querymen';
import _ from 'lodash';

export function createQuerymenSchema(mongooseSchema, additionalQueryFilter = {}) {
	const qFilters = _.get(additionalQueryFilter, 'q.paths', [])
	const schema = _.reduce(mongooseSchema.paths, (acc, field, name) => {
		if(qFilters.includes(name)) {
			return acc
		}
		acc[field.instance] = {
			type: field.instance,
			paths: [field]
		}
		return acc
	}, { ...additionalQueryFilter})

	return new querymen.Schema(schema);
}

