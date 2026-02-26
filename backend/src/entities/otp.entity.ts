import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum OtpStatus {
    UNUSED = 'UNUSED',
    USED = 'USED',
}

@Entity('otps')
export class Otp {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    mobile: string;

    @Column()
    otp: string;

    @Column()
    expiry: string;

    @Column({ type: 'text', default: OtpStatus.UNUSED })
    status: OtpStatus;

    @Column({ default: () => "datetime('now')" })
    created_at: string;
}
