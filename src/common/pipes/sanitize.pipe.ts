import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || typeof value !== 'object') {
      return value;
    }

    const sanitized = {};

    for (const key of Object.keys(value)) {
      const field = value[key];

      sanitized[key] =
        typeof field === 'string' ? sanitizeHtml(field.trim()) : field;
    }

    return sanitized;
  }
}
