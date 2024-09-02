const { DataTypes } = require("sequelize");

module.exports = (db) => {
    const Mails = db.sequelize.define('mails', {
            ml_id: {type: DataTypes.UUID, primaryKey: true, defaultValue: db.Sequelize.UUIDV4, allowNull: false},
            ml_key: {type: DataTypes.STRING(100), allowNull: true},
            ml_subject: {type: DataTypes.STRING(256), allowNull: true},
            ml_body: {type: DataTypes.TEXT, allowNull: true},
            ml_description: {type: DataTypes.TEXT, allowNull: true},
            ml_created_by: {type: DataTypes.UUID},
            ml_created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW},
            ml_updated_by: {type: DataTypes.UUID},
            ml_updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: db.Sequelize.NOW}
        },
        {
            indexes: [
                {unique: true, fields: ['ml_id']}
            ],
            timestamps: true,
            underscrored: true,
            createdAt: false,
            updatedAt: false,
            hooks: {
                beforeCreate: async (o, options) => {
                    o.ml_created_at = new Date();
                    o.ml_updated_at = new Date();
                },
                beforeUpdate: async (o, options) => {
                    o.ml_updated_at = new Date();
                }
            }
        });

    // Mails.add = async (req, data) => {
    //     return new Promise(async (resolve, reject) => {
    //         try {

    //             let data = {
    //                 MAIL_WEB_URL: process.env.MAIL_WEB_URL,
    //                 MAIL_PRODUCT_NAME: process.env.MAIL_PRODUCT_NAME,
    //                 MAIL_SUPPORT_URL: process.env.MAIL_SUPPORT_URL,
    //                 UA_OPERATING_SYSTEM: 'OS',
    //                 UA_BROWSER_NAME: 'Browser',
    //                 user_name: 'User'

    //             }
    //             const ml_body = `
    //             <!--[if mso]><style type="text/css">.f-fallback  {font-family: Arial, sans-serif;}</style><![endif]-->
    //             <p>Use this link to reset your password. The link is only valid for 48 hours.</p>
    //             <table cellpadding="0" cellspacing="0" style="width:100%">
    //                 <tbody>
    //                     <tr>
    //                         <td>
    //                             <table cellpadding="0" cellspacing="0" style="width:100%">
    //                                 <tbody>
    //                                     <tr>
    //                                         <td style="text-align:center"><a href="${data.MAIL_WEB_URL}">${data.MAIL_PRODUCT_NAME}</a></td>
    //                                     </tr>
    //                                     <!-- Email Body -->
    //                                     <tr>
    //                                         <td style="width:100%">
    //                                             <table align="center" cellpadding="0" cellspacing="0" style="width:570px">
    //                                                 <!-- Body content -->
    //                                                 <tbody>
    //                                                     <tr>
    //                                                         <td>
    //                                                             <h1>Hi ${data.user_name} ,</h1>
    //                                                             <p>You recently requested to reset your password for your ${data.MAIL_PRODUCT_NAME} account. Use the button below to reset it. <strong>This password reset is only valid for the next 48 hours.</strong></p>
    //                                                             <!-- Action -->
    //                                                             <table align="center" cellpadding="0" cellspacing="0" style="width:100%">
    //                                                                 <tbody>
    //                                                                     <tr>
    //                                                                         <td>
    //                                                                             <!-- Border based buttonhttps://litmus.com/blog/a-guide-to-bulletproof-buttons-in-email-design -->
    //                                                                             <table border="0" cellpadding="0" cellspacing="0" style="width:100%">
    //                                                                                 <tbody>
    //                                                                                     <tr>
    //                                                                                         <td><a href="{{action_url}}" target="_blank">Reset your password</a></td>
    //                                                                                     </tr>
    //                                                                                 </tbody>
    //                                                                             </table>
    //                                                                         </td>
    //                                                                     </tr>
    //                                                                 </tbody>
    //                                                             </table>
    //                                                             <p>Note - You can also generate a password by directly going to ${data.MAIL_PRODUCT_NAME} site ${data.MAIL_WEB_URL} and by clicking on the Forgot / Generate Password link.</p>
    //                                                             <p>For security, this request was received from a ${data.UA_OPERATING_SYSTEM} device using ${data.UA_BROWSER_NAME}. If you did not request a password reset, please ignore this email or <a href="${data.MAIL_SUPPORT_URL}">contact support</a> if you have questions.</p>
    //                                                             <p>Thanks,<br />The ${data.MAIL_PRODUCT_NAME} Team</p>
    //                                                             <!-- Sub copy -->
    //                                                             <table>
    //                                                                 <tbody>
    //                                                                     <tr>
    //                                                                         <td>
    //                                                                             <p>If you’re having trouble with the button above, copy and paste the URL below into your web browser.</p>
    //                                                                             <p>{{action_url}}</p>
    //                                                                         </td>
    //                                                                     </tr>
    //                                                                 </tbody>
    //                                                             </table>
    //                                                         </td>
    //                                                     </tr>
    //                                                 </tbody>
    //                                             </table>
    //                                         </td>
    //                                     </tr>
    //                                     <tr>
    //                                         <td>
    //                                             <table align="center" cellpadding="0" cellspacing="0" style="width:570px">
    //                                                 <tbody>
    //                                                     <tr>
    //                                                         <td><p>&copy; 2024 ${data.MAIL_PRODUCT_NAME}. All rights reserved.</p></td>
    //                                                     </tr>
    //                                                 </tbody>
    //                                             </table>
    //                                         </td>
    //                                     </tr>
    //                                 </tbody>
    //                             </table>
    //                         </td>
    //                     </tr>
    //                 </tbody>
    //             </table>`;

    //             const sqlQuery = `
    //                 INSERT INTO "mails" (ml_id, ml_key, ml_subject, ml_body, ml_description ,  ml_created_at,  ml_updated_at) 
    //                 VALUES (:ml_id, :ml_key, :ml_subject, :ml_body, :ml_description ,  :ml_created_at,  :ml_updated_at)
    //             `;

    //           const mail_info =   await db.sequelize.query(sqlQuery, {
    //                 replacements: {
    //                   ml_id:'687ef3bb-5d8c-4146-9a49-06760972da5f',
    //                     ml_key: 'resetPassword',
    //                     ml_subject: 'Reset Password: Girikon.AI',
    //                     ml_body: ml_body,
    //                     ml_description: '',
    //                     ml_created_at: new Date(),
    //                     ml_updated_at: new Date()

    //                 },
    //                 type: db.sequelize.QueryTypes.INSERT
    //             });

    //           resolve(mail_info);
              
    //         } catch (e) {
    //             reject(e);
    //         }
    //     });
    // };

    return Mails;
}
