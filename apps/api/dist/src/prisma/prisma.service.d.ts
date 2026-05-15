import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/app-config.service';
/**
 * Single PrismaClient instance shared across the API.
 * Tied to Nest lifecycle so connections close cleanly on shutdown.
 */
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor(config: AppConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
