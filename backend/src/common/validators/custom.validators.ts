import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Custom Validation Decorators
 * 
 * SECURITY: OWASP-compliant input validation
 * 
 * These decorators provide additional validation beyond standard class-validator:
 * - Safe string validation (no control characters)
 * - Bounded text validation (length + content checks)
 * - Secure API key format validation
 */

/**
 * Constraint: Validates string contains no dangerous characters
 */
@ValidatorConstraint({ name: 'isSafeString', async: false })
export class IsSafeStringConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }
    
    // Check for null bytes and most control characters
    // Allow newlines and tabs for multiline text
    const dangerousCharsRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
    return !dangerousCharsRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} contains invalid characters`;
  }
}

/**
 * Validates that a string is safe (no control characters except newline/tab)
 */
export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeStringConstraint,
    });
  };
}

/**
 * Constraint: Validates string is within bounds and safe
 */
@ValidatorConstraint({ name: 'isBoundedText', async: false })
export class IsBoundedTextConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }
    
    const [minLength, maxLength] = args.constraints;
    
    // Check length bounds
    if (value.length < minLength || value.length > maxLength) {
      return false;
    }
    
    // Check for null bytes
    if (value.includes('\x00')) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const [minLength, maxLength] = args.constraints;
    return `${args.property} must be between ${minLength} and ${maxLength} characters and contain no null bytes`;
  }
}

/**
 * Validates string is within length bounds and safe
 * 
 * @param minLength - Minimum string length
 * @param maxLength - Maximum string length
 */
export function IsBoundedText(
  minLength: number,
  maxLength: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [minLength, maxLength],
      validator: IsBoundedTextConstraint,
    });
  };
}

/**
 * Constraint: Validates secure URL format
 */
@ValidatorConstraint({ name: 'isSecureUrl', async: false })
export class IsSecureUrlConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return false;
    }
    
    try {
      const url = new URL(value);
      
      // Only allow https in production-like environments
      const allowedProtocols = ['https:'];
      
      // Allow http for localhost in development
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        allowedProtocols.push('http:');
      }
      
      return allowedProtocols.includes(url.protocol);
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid HTTPS URL`;
  }
}

/**
 * Validates that a URL is secure (HTTPS, or HTTP for localhost)
 */
export function IsSecureUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecureUrlConstraint,
    });
  };
}

/**
 * Constraint: Validates no SQL injection patterns
 * Note: This is defense-in-depth; Prisma uses parameterized queries
 */
@ValidatorConstraint({ name: 'noSqlInjection', async: false })
export class NoSqlInjectionConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (typeof value !== 'string') {
      return true; // Let other validators handle non-strings
    }
    
    // Common SQL injection patterns
    const sqlInjectionPatterns = [
      /('|"|;|--|\/\*|\*\/|xp_|sp_|0x)/i,
      /(union\s+select|insert\s+into|delete\s+from|drop\s+table|alter\s+table)/i,
      /(exec\s*\(|execute\s*\()/i,
    ];
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(value)) {
        return false;
      }
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} contains potentially dangerous content`;
  }
}

/**
 * Validates string doesn't contain common SQL injection patterns
 * Defense-in-depth alongside Prisma's parameterized queries
 */
export function NoSqlInjection(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoSqlInjectionConstraint,
    });
  };
}

/**
 * Constraint: Validates array length bounds
 */
@ValidatorConstraint({ name: 'arrayMaxSize', async: false })
export class ArrayMaxSizeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (!Array.isArray(value)) {
      return true; // Let @IsArray handle this
    }
    
    const [maxSize] = args.constraints;
    return value.length <= maxSize;
  }

  defaultMessage(args: ValidationArguments) {
    const [maxSize] = args.constraints;
    return `${args.property} must contain no more than ${maxSize} items`;
  }
}

/**
 * Validates array doesn't exceed maximum size
 * Prevents DoS via large arrays
 */
export function ArrayBounded(
  maxSize: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxSize],
      validator: ArrayMaxSizeConstraint,
    });
  };
}
