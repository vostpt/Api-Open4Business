import { Injectable, Logger, HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class AccountService {
  constructor(
    private http: HttpService, private readonly logger: Logger) {}

    async createAccount(authId: string, password: string, name: string, business: string) {

      return this.http.post(`http://localhost:${process.env.PORT}/api/auth/v1/signup`, {authId, password, name, business})
              .pipe(
                  map(response => response.data)
              ); 
    }

  async confirmAccount(token: string, confirmationCode: string) {
    return this.http.put(`http://localhost:${process.env.PORT}/api/auth/v1/confirm`, {token, confirmationCode})
            .pipe(
                map(response => response.data)
            ); 
  }
}
