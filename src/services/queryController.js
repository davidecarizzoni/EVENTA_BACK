import querymen from 'querymen';

export function createQuerymenSchema(mongooseSchema) {
  const schema = {};
  Object.keys(mongooseSchema.paths).map(field => {
    schema[field] = {
      type: mongooseSchema.paths[field].instance,
      paths: [field]
    };
  });
  return new querymen.Schema(schema);
}

