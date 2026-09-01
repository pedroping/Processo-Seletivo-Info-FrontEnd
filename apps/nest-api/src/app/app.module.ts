import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { TokenCookieGuard } from '../common/guards/token-cookie.guard';
import { RequestSourceMiddleware } from '../common/middleware/request-source.middleware';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [AuthModule, VehiclesModule, BrandsModule, CategoriesModule],
  providers: [{ provide: APP_GUARD, useClass: TokenCookieGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestSourceMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
