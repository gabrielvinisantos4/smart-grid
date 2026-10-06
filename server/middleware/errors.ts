import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Recurso não encontrado.'));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message, details: error.details });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Arquivo muito grande (máx. 12 MB).' : 'Falha no upload.';
    return res.status(400).json({ error: message });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'JSON inválido.' });
  }
  console.error(error);
  res.status(500).json({ error: 'Erro interno. Tente novamente.' });
}
