import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handling middleware
 */
export const asyncMiddleware = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Type-safe async middleware wrapper
 */
export type AsyncRequestHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<any>;

export const wrapAsync = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Utility to wrap all methods of a controller class
 */
export const wrapController = <T extends object>(controller: T): T => {
  const wrappedController = {} as T;

  Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach((key) => {
    const method = (controller as any)[key];
    
    if (typeof method === 'function' && key !== 'constructor') {
      (wrappedController as any)[key] = asyncMiddleware(method.bind(controller));
    }
  });

  return wrappedController;
};