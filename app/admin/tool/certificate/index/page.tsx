"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

interface Certificate {
  id: string;
  first_name: string;
  middle_name?: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  certificate: string;
  date_issued: string; // For date only
  time_issued: string; // For time only
  expiry_date: string;
  status: 'Valid' | 'Invalid';
  hours_quantity: number;
  pdf_url?: string; // Add this field for the PDF URL
}

export default function CertificatePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchParams = useSearchParams();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const [verificationResult, setVerificationResult] = useState('');
  const [codeInputValue, setCodeInputValue] = useState('');
  const [verifiedCertificate, setVerifiedCertificate] = useState<Certificate | null>(null);
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setCodeInputValue(code);
      // Removed automatic verification on URL load as per user request.
      // Verification will now only happen when the "Verify" button is clicked.
      // handleVerify(null, code); // Pass null for event, and the code directly
    }
  }, [searchParams]);

  const translations = {
    en: {
      verifyCertificates: 'Verify certificates',
      code: 'Code',
      verify: 'Verify',
      home: 'Home',
      language: 'English (en)',
      validCertificate: 'Valid', // For table status
      invalidCertificate: 'Invalid', // For table status
      alertValidCertificate: 'This certificate is valid', // For alert message
      alertInvalidCertificate: 'The certificate is not valid. Please check the code and try again.', // For alert message
      alertNotVerified: 'Not verified', // For alert when code not found
      certificateDetails: 'Certificate Details',
      issuedTo: 'Issued To',
      course: 'Course',
      dateIssued: 'Date Issued',
      login: 'You are not logged in. (',
      logInLink: 'Log in',
      loginEnd: ')',
      fullName: 'Full name',
      certificate: 'Certificate',
      expiryDate: 'Expiry date',
      status: 'Status',
      viewCertificate: 'View certificate',
      never: 'Never',
      // hours: 'Hours', // Removed as per user request
    },
    es: {
      verifyCertificates: 'Verificar certificados',
      code: 'Código',
      verify: 'Verificar',
      home: 'Página principal',
      language: 'Español (es)',
      validCertificate: 'Válido', // For table status
      invalidCertificate: 'Inválido', // For table status
      alertValidCertificate: 'Este certificado es válido', // For alert message
      alertInvalidCertificate: 'El certificado no es válido. Por favor, compruebe el código e inténtelo de nuevo.', // For alert message
      alertNotVerified: 'No verificado', // For alert when code not found
      certificateDetails: 'Detalles del Certificado',
      issuedTo: 'Emitido a',
      course: 'Curso',
      dateIssued: 'Fecha y Hora de Emisión', // Updated translation
      login: 'Usted no se ha identificado. (',
      logInLink: 'Acceder',
      loginEnd: ')',
      fullName: 'Nombre completo',
      certificate: 'Certificado',
      expiryDate: 'Fecha de vencimiento',
      status: 'Estado',
      viewCertificate: 'Ver certificado',
      never: 'Nunca',
      // hours: 'Horas', // Removed as per user request
    },
    fr: {
      verifyCertificates: 'Vérifier les certificats',
      code: 'Code',
      verify: 'Vérifier',
      home: 'Accueil',
      language: 'Français (fr)',
      validCertificate: 'Valide',
      invalidCertificate: 'Invalide',
      alertValidCertificate: 'Le certificat est valide',
      alertInvalidCertificate: "Le certificat n'est pas valide. Veuillez vérifier le code et réessayer.",
      alertNotVerified: 'Non vérifié',
      certificateDetails: 'Détails du Certificat',
      issuedTo: 'Délivré à',
      course: 'Cours',
      dateIssued: "Date et Heure d'émission", // Updated translation
      login: 'Vous n\'êtes pas connecté. (',
      logInLink: 'Se connecter',
      loginEnd: ')',
      fullName: 'Nom complet',
      certificate: 'Certificat',
      expiryDate: "Date d'expiration",
      status: 'Statut',
      viewCertificate: 'Voir le certificat',
      never: 'Jamais',
      // hours: 'Heures', // Removed as per user request
    },
    pt_br: {
      verifyCertificates: 'Verificar certificados',
      code: 'Código',
      verify: 'Verificar',
      home: 'Início',
      language: 'Português (pt_br)',
      validCertificate: 'Válido',
      invalidCertificate: 'Inválido',
      alertValidCertificate: 'O certificado é válido',
      alertInvalidCertificate: 'O certificado não é válido. Por favor, verifique o código e tente novamente.',
      alertNotVerified: 'Não verificado',
      certificateDetails: 'Detalhes do Certificado',
      issuedTo: 'Emitido para',
      course: 'Curso',
      dateIssued: 'Data e Hora de Emissão', // Updated translation
      login: 'Você não está logado. (',
      logInLink: 'Entrar',
      loginEnd: ')',
      fullName: 'Nome completo',
      certificate: 'Certificado',
      expiryDate: 'Data de validade',
      status: 'Status',
      viewCertificate: 'Ver certificado',
      never: 'Nunca',
      // hours: 'Horas', // Removed as per user request
    },
    ar: {
      verifyCertificates: 'التحقق من الشهادات',
      code: 'الرمز',
      verify: 'التحقق',
      home: 'الرئيسية',
      language: 'العربية (ar)',
      validCertificate: 'صالح',
      invalidCertificate: 'غير صالح',
      alertValidCertificate: 'الشهادة صالحة',
      alertInvalidCertificate: 'الشهادة غير صالحة. يرجى التحقق من الرمز والمحاولة مرة أخرى.',
      alertNotVerified: 'غير محقق',
      certificateDetails: 'تفاصيل الشهادة',
      issuedTo: 'صدرت ل',
      course: 'دورة',
      dateIssued: 'تاريخ ووقت الإصدار', // Updated translation
      login: 'أنت غير مسجل الدخول. (',
      logInLink: 'تسجيل الدخول',
      loginEnd: ')',
      fullName: 'الاسم الكامل',
      certificate: 'شهادة',
      expiryDate: 'تاريخ انتهاء الصلاحية',
      status: 'الحالة',
      viewCertificate: 'عرض الشهادة',
      never: 'أبداً',
      // hours: 'ساعات', // Removed as per user request
    },
  };

  type Language = keyof typeof translations;
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  const renderVerificationResult = (cert: Certificate | null, currentLanguage: Language) => {
    if (!cert) return '';
    const currentT = translations[currentLanguage];
    const fullName = [
      cert.first_name,
      cert.middle_name,
      cert.paternal_last_name,
      cert.maternal_last_name
    ].filter(Boolean).join(' ');

    return `
      <div class="alert alert-block fade in alert-success mb-2" role="alert">
        <p class="m-0 alert-success">${currentT.alertValidCertificate}</p>
      </div>
      <table class="admintable generaltable mb-2">
        <tbody>
          <tr class="">
            <td class="cell c0" style="">${currentT.fullName}</td>
            <td class="cell c1 lastcol" style="">${fullName}</td>
          </tr>
          <tr class="">
            <td class="cell c0" style="">${currentT.certificate}</td>
            <td class="cell c1 lastcol" style="">${cert.certificate || 'N/A'}</td>
          </tr>
          <tr class="">
            <td class="cell c0" style="">${currentT.dateIssued}</td>
            <td class="cell c1 lastcol" style="">${new Date(`${cert.date_issued}T${cert.time_issued}`).toLocaleString(currentLanguage, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
          <tr class="">
            <td class="cell c0" style="">${currentT.expiryDate}</td>
            <td class="cell c1 lastcol" style="">${cert.expiry_date === 'Never' ? currentT.never : new Date(cert.expiry_date).toLocaleString(currentLanguage, { year: 'numeric', month: 'long', day: 'numeric' })}</td>
          </tr>
          <tr class="lastrow">
            <td class="cell c0" style="">${currentT.status}</td>
            <td class="cell c1 lastcol" style="">${cert.status === 'Valid' ? currentT.validCertificate : currentT.invalidCertificate}</td>
          </tr>
        </tbody>
      </table>
      ${cert.pdf_url ? `<a class="btn btn-sm btn-secondary" href="${cert.pdf_url}" target="_blank" rel="noopener noreferrer">${currentT.viewCertificate}</a>` : ''}
    `;
  };

  useEffect(() => {
    if (verifiedCertificate) {
      setVerificationResult(renderVerificationResult(verifiedCertificate, language));
    }
  }, [language, verifiedCertificate]);

  const handleVerify = async (event: React.FormEvent | null, initialCode: string | null = null) => {
    if (event) event.preventDefault();
    const code = initialCode || codeInputValue;

    if (!code) {
      setVerificationResult(`
        <div class="alert alert-danger" role="alert">
          <span class="sr-only">Error</span>
          <i class="icon fa fa-times-circle fa-fw " aria-hidden="true"></i>
          ${t.alertNotVerified}
        </div>
      `);
      setVerifiedCertificate(null);
      return;
    }

    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .eq('id', code)
      .single();

    if (error || !data) {
      console.error('Error fetching certificate:', error);
      setVerificationResult(`
        <div class="alert alert-danger" role="alert">
          <span class="sr-only">Error</span>
          <i class="icon fa fa-times-circle fa-fw " aria-hidden="true"></i>
          ${t.alertInvalidCertificate}
        </div>
      `);
      setVerifiedCertificate(null);
    } else {
      const certificate: Certificate = data;
      setVerifiedCertificate(certificate);
      setVerificationResult(renderVerificationResult(certificate, language));
    }
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCodeInputValue(event.target.value);
  };

  return (
    <>
      <div className="toast-wrapper mx-auto py-0 fixed-top" role="status" aria-live="polite"></div>
      <div id="page-wrapper" className={`d-print-block ${isDrawerOpen ? 'drawer-open' : ''}`} >
        <div>
          <a className="sr-only sr-only-focusable" href="#maincontent">Skip to main content</a>
        </div>
        <nav className="fixed-top navbar navbar-light bg-white navbar-expand moodle-has-zindex" aria-label="Site navigation">
          <div data-region="drawer-toggle" className="d-inline-block mr-3">
            <button aria-expanded={isDrawerOpen} aria-controls="nav-drawer" type="button" className="btn nav-link float-sm-left mr-1 btn-light bg-gray" data-action="toggle-drawer" data-side="left" data-preference="drawer-open-nav" onClick={toggleDrawer}><i className="icon fa fa-bars fa-fw " aria-hidden="true"></i><span className="sr-only">Side panel</span></button>
          </div>
          <a href="https://school.profuturo.education" className="navbar-brand aabtn d-none d-sm-inline">
            <span className="site-name d-none d-md-inline">profuturo</span>
          </a>
          <ul className="navbar-nav d-none d-md-flex">
            <li className="dropdown nav-item">
              <a className="dropdown-toggle nav-link" id="drop-down-68640e702062f68640e701ea654" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" href="#" title="Language" aria-controls="drop-down-menu-68640e702062f68640e701ea654">
                {t.language}
              </a>
              <div className="dropdown-menu" role="menu" id="drop-down-menu-68640e702062f68640e701ea654" aria-labelledby="drop-down-68640e702062f68640e701ea654">
                <a className="dropdown-item" role="menuitem" href="#" onClick={() => setLanguage('en')} >English ‎(en)‎</a>
                <a className="dropdown-item" role="menuitem" href="#" onClick={() => setLanguage('es')} >Español ‎(es)‎</a>
                <a className="dropdown-item" role="menuitem" href="#" onClick={() => setLanguage('fr')} >Français ‎(fr)‎</a>
                <a className="dropdown-item" role="menuitem" href="#" onClick={() => setLanguage('pt_br')} >Português ‎(pt_br)‎</a>
                <a className="dropdown-item" role="menuitem" href="#" onClick={() => setLanguage('ar')} >العربية ‎(ar)‎</a>
              </div>
            </li>
          </ul>
          <div className="ml-auto">
          </div>
          <ul className="nav navbar-nav usernav">
            <li className="nav-item">
            </li>
            <li className="nav-item align-items-center pl-2">
            </li>
          </ul>
        </nav>
        <div id="nav-drawer" data-region="drawer" className={`d-print-none moodle-has-zindex ${isDrawerOpen ? 'open' : 'closed'}`} aria-hidden={!isDrawerOpen} tabIndex={-1}>
          <nav className="list-group" aria-label="Site">
            <ul>
              <li>
                <a className="list-group-item list-group-item-action  " href="https://school.profuturo.education/" data-key="home" data-isexpandable="0" data-indent="0" data-showdivider="0" data-type="1" data-nodetype="1" data-collapse="0" data-forceopen="1" data-isactive="0" data-hidden="0" data-preceedwithhr="0">
                  <div className="ml-0">
                    <div className="media">
                      <span className="media-left">
                        <i className="icon fa fa-home fa-fw " aria-hidden="true"></i>
                      </span>
                      <span className="media-body ">{t.home}</span>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div id="page" className="container-fluid d-print-block">
          <header id="page-header" className="row">
            <div className="col-12 pt-3 pb-3">
              <div className="card ">
                <div className="card-body ">
                  <div className="d-sm-flex align-items-center">
                    <div className="mr-auto">
                      <div className="page-context-header"><div className="page-header-headings"><h1>{t.verifyCertificates}</h1></div></div>
                    </div>
                    <div className="header-actions-container flex-shrink-0" data-region="header-actions-container">
                    </div>
                  </div>
                  <div className="d-flex flex-wrap">
                    <div id="page-navbar">
                      <nav aria-label="Navigation bar">
                        <ol className="breadcrumb"></ol>
                      </nav>
                    </div>
                    <div className="ml-auto d-flex">
                    </div>
                    <div id="course-header">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div id="page-content" className="row pb-3 d-print-block">
            <div id="region-main-box" className="col-12">
              <section id="region-main" aria-label="Content">
                <span className="notifications" id="user-notifications"></span>
                <div role="main"><span id="maincontent"></span>
                  <form className="mt-3 mb-5 p-4 bg-light mform" autoComplete="off" onSubmit={handleVerify}>
                    <div id="fitem_id_code" className="form-group row  fitem   ">
                      <div className="col-md-3 col-form-label d-flex pb-0 pr-md-0">
                        <label className="d-inline word-break " htmlFor="id_code">
                          {t.code}
                        </label>
                        <div className="form-label-addon d-flex align-items-center align-self-start">
                          <div className="text-danger" title="Required">
                            <i className="icon fa fa-exclamation-circle text-danger fa-fw " title="Required" role="img" aria-label="Required"></i>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-9 form-inline align-items-start felement" data-fieldtype="text">
                        <input type="text"
                          className="form-control "
                          name="code"
                          id="id_code"
                          value={codeInputValue}
                          onChange={handleCodeChange}
                        />
                        <div className="form-control-feedback invalid-feedback" id="id_error_code">
                        </div>
                      </div>
                    </div>
                    <div id="fitem_id_verify" className="form-group row  fitem femptylabel  ">
                      <div className="col-md-3 col-form-label d-flex pb-0 pr-md-0">
                        <div className="form-label-addon d-flex align-items-center align-self-start">
                        </div>
                      </div>
                      <div className="col-md-9 form-inline align-items-start felement" data-fieldtype="submit">
                        <input type="submit"
                          className="btn
                        btn-primary
                    "
                          name="verify"
                          id="id_verify"
                          value={t.verify}
                        />
                        <div className="form-control-feedback invalid-feedback" id="id_error_verify">
                        </div>
                      </div>
                    </div>
                    <div className="fdescription required">There are required fields in this form marked <i className="icon fa fa-exclamation-circle text-danger fa-fw " title="Required field" role="img" aria-label="Required field"></i>.</div>
                  </form>
                  {verificationResult && (
                    <div dangerouslySetInnerHTML={{ __html: verificationResult }} />
                  )}

                </div>
              </section>
            </div>
          </div>
        </div>
        <div id="goto-top-link">
          <a className="btn btn-light" role="button" href="#" aria-label="Go to top">
            <i className="icon fa fa-arrow-up fa-fw " aria-hidden="true"></i>
          </a>
        </div>
        <footer id="page-footer" className="py-3 bg-dark text-light">
          <div className="container">
            <div id="course-footer"></div>
            <div className="logininfo">{t.login}<a href="https://school.profuturo.education/login/index.php">{t.logInLink}</a>{t.loginEnd}</div>
            <div className="tool_usertours-resettourcontainer"></div>
            <div className="homelink"><a href="https://school.profuturo.education/">{t.home}</a></div>
            <nav className="nav navbar-nav d-md-none" aria-label="Menú personalizado">
              <ul className="list-unstyled pt-3">
                <li><a href="#" title="Idioma">{t.language}</a></li>
                <li>
                  <ul className="list-unstyled ml-3">
                    <li><a href="https://school.profuturo.education/admin/tool/certificate/index.php?code=6606202546RH&lang=en" title="English ‎(en)‎">English ‎(en)‎</a></li>
                    <li><a href="https://school.profuturo.education/admin/tool/certificate/index.php?code=6606202546RH&lang=es" title="Español ‎(es)‎">Español ‎(es)‎</a></li>
                    <li><a href="https://school.profuturo.education/admin/tool/certificate/index.php?code=6606202546RH&lang=fr" title="Français ‎(fr)‎">Français ‎(fr)‎</a></li>
                    <li><a href="https://school.profuturo.education/admin/tool/certificate/index.php?code=6606202546RH&lang=pt_br" title="Português ‎(pt_br)‎">Português ‎(pt_br)‎</a></li>
                    <li><a href="https://school.profuturo.education/admin/tool/certificate/index.php?code=6606202546RH&lang=ar" title="العربية ‎(ar)‎">العربية ‎(ar)‎</a></li>
                  </ul>
                </li>
              </ul>
            </nav>
            <div className="tool_dataprivacy"><a href="https://school.profuturo.education/admin/tool/dataprivacy/summary.php">Resumen de retención de datos</a></div><a href="https://download.moodle.org/mobile?version=2021051706.11&lang=es&iosappid=633359593&androidappid=com.moodle.moodlemobile">Descargar la app para dispositivos móviles</a>
          </div>
        </footer>
      </div>
    </>
  )
}
