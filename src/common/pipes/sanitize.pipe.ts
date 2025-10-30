import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
    }
    if (value && typeof value === 'object') {
      const out: any = {};
      for (const key of Object.keys(value)) {
        const v = value[key];
        out[key] = typeof v === 'string'
          ? sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} }).trim()
          : v;
      }
      return out;
    }
    return value;
  }
}
