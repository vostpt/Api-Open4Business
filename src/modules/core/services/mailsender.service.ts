import {Injectable, Logger} from '@nestjs/common';
import {renderFile} from 'ejs';
import {createTransport} from 'nodemailer';
import {join} from 'path';

import {environment} from '../../../config/environment';

@Injectable()
export class MailSenderService {
  private readonly loggerContext = MailSenderService.name;

  private transport = createTransport({
    service: 'gmail',
    auth: {
      user: environment.smtpEmail, 
      pass: environment.smtpPassword,
    }
  });

  

  // private transport = createTransport({
  //   host: 'smtp.gmail.com',
  //   port: 587,
  //   secure: false,
  //   requireTLS: true,
  //   auth: {
  //       user: environment.smtpEmail,
  //       pass: environment.smtpPassword
  //   }
  // });

  constructor(private readonly logger: Logger) {
    console.log(environment.smtpEmail, environment.smtpPassword);
  }

  sendConfirmAccountEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/confirmAccount.ejs');

    renderFile(
        templateUrl, {
          ...locals,
          headerImageUrl:
              'https://info.vost.pt/wp-content/uploads/2020/04/Open4Business_Header_NewLogo.png'
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file confirmAccount.ejs',
                this.loggerContext, err);
            return;
          } else {
            const mainOptions = {
              from: '"Open4Business by VOSTPT"<no-reply@vost.pt>',
              to: locals.emailToSend,
              subject: 'Conta registada',
              html: data
            };
            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                this.logger.error(
                    'Error while trying to send confirmation account email',
                    this.loggerContext);
              }
            });
          }
        });
  }

  sendInviteEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/inviteRegister.ejs');
    renderFile(
        templateUrl, {
          confirmationCode: locals.confirmationCode,
          activationUrl: locals.activationUrl
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file inviteRegister.ejs',
                this.loggerContext);
            return;
          } else {
            const mainOptions = {
              from: '',
              to: locals.emailToSend,
              subject: 'Invite',
              html: data
            };
            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                this.logger.error(
                    'Error while trying to send invite register email',
                    this.loggerContext);
              }
            });
          }
        });
  }

  sendInviteInformationEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/inviteInformationEmail.ejs');
    renderFile(templateUrl, {userEmail: locals.newUserEmail}, (err, data) => {
      if (err) {
        this.logger.error(
            'Error while trying to render file inviteInformationEmail.ejs',
            this.loggerContext);
        return;
      } else {
        const mainOptions = {
          from: '',
          to: locals.emailToSend,
          subject: 'Invite sent',
          html: data
        };
        return this.transport.sendMail(mainOptions, (error) => {
          if (error) {
            this.logger.error(
                'Error while trying to send invite information email',
                this.loggerContext);
          }
        });
      }
    });
  }

  sendWarningEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/warningEmail.ejs');
    renderFile(templateUrl, {serviceName: locals.serviceName}, (err, data) => {
      if (err) {
        this.logger.error(
            'Error while trying to render file warningEmail.ejs',
            this.loggerContext);
        return;
      } else {
        const mainOptions =
            {from: '', to: locals.emailToSend, subject: 'Warning', html: data};
        return this.transport.sendMail(mainOptions, (error) => {
          if (error) {
            this.logger.error(
                'Error while trying to send confirmation account email',
                this.loggerContext);
          }
        });
      }
    });
  }

  sendSignUpNotificationEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/signUpNotification.ejs');
    console.log(templateUrl);
    renderFile(
        templateUrl, {
          activationUrl: locals.activationUrl,
          userEmail: locals.userEmail,
          userName: locals.userName,
          headerImageUrl:
              'https://info.vost.pt/wp-content/uploads/2020/04/Open4Business_Header_NewLogo.png'
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file signUpNotification.ejs',
                this.loggerContext);
            return;
          } else {
            const mainOptions = {
              from: '"Open4Business by VOSTPT"<no-reply@vost.pt>',
              to: locals.emailToSend,
              subject: 'Nova empresa registada',
              html: data
            };

            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                console.log(error);
                this.logger.error(
                    'Error while trying to send confirmation account email',
                    this.loggerContext);
              }
            });
          }
        });
  }

  sendRecoverEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/recoverPassword.ejs');
    renderFile(templateUrl, {resetUrl: locals.resetUrl}, (err, data) => {
      if (err) {
        this.logger.error(
            'Error while trying to render file recoverPassword.ejs',
            this.loggerContext);
        return;
      } else {
        const mainOptions = {
          from: '',
          to: locals.emailToSend,
          subject: 'Recover password',
          html: data
        };
        return this.transport.sendMail(mainOptions, (error) => {
          if (error) {
            this.logger.error(
                'Error while trying to send confirmation account email',
                this.loggerContext);
          }
        });
      }
    });
  }

  sendPortalInviteEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/portalInviteEmail.ejs');
    renderFile(templateUrl, {registerUrl: locals.registerUrl}, (err, data) => {
      if (err) {
        this.logger.error(
            'Error while trying to render file portalInviteEmail.ejs',
            this.loggerContext);
        return;
      } else {
        const mainOptions = {
          from: '',
          to: locals.emailToSend,
          subject: 'Portal invite',
          html: data
        };
        return this.transport.sendMail(mainOptions, (error) => {
          if (error) {
            this.logger.error(
                'Error while trying to send portal invite email',
                this.loggerContext);
          }
        });
      }
    });
  }

  sendAccountConfirmedEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/accountConfirmedEmail.ejs');
    renderFile(
        templateUrl, {
          ...locals,
          headerImageUrl:
              'https://info.vost.pt/wp-content/uploads/2020/04/Open4Business_Header_NewLogo.png'
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file accountConfirmedEmail.ejs',
                this.loggerContext, err);
            return;
          } else {
            const mainOptions = {
              from: '"Open4Business by VOSTPT"<no-reply@vost.pt>',
              to: locals.emailToSend,
              subject: 'Conta confirmada',
              html: data
            };
            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                this.logger.error(
                    'Error while trying to send account confirmed email',
                    this.loggerContext);
              }
            });
          }
        });
  }

  sendImportNotificationEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/importNotification.ejs');

    renderFile(
        templateUrl, {
          ...locals,
          headerImageUrl:
              'https://info.vost.pt/wp-content/uploads/2020/04/Open4Business_Header_NewLogo.png'
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file confirmAccount.ejs',
                this.loggerContext, err);
            return;
          } else {
            const mainOptions = {
              from: '"Open4Business by VOSTPT"<no-reply@vost.pt>',
              to: locals.emailToSend,
              subject: `Lojas ${locals.status}: ${locals.company}`,
              html: data
            };
            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                console.log(error);
                this.logger.error(
                    'Error while trying to send upload locations email',
                    this.loggerContext);
              }
            });
          }
        });
  }

  sendImportConfirmationEmail(locals) {
    const templateUrl =
        join(__dirname, '../../../assets/templates/importConfirmation.ejs');

    renderFile(
        templateUrl, {
          ...locals,
          headerImageUrl:
              'https://info.vost.pt/wp-content/uploads/2020/04/Open4Business_Header_NewLogo.png'
        },
        (err, data) => {
          if (err) {
            this.logger.error(
                'Error while trying to render file confirmAccount.ejs',
                this.loggerContext, err);
            return;
          } else {
            const mainOptions = {
              from: '"Open4Business by VOSTPT"<no-reply@vost.pt>',
              to: locals.emailToSend,
              subject: 'Lojas Importadas: Ativadas',
              html: data
            };

            return this.transport.sendMail(mainOptions, (error) => {
              if (error) {
                console.error('sendMail: ImportConfirmationEmail', error);
                this.logger.error(
                    'Error while trying to send locations review account email',
                    this.loggerContext);
              }
            });
          }
        });
  }
}
