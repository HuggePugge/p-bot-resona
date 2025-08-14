import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './KontrollavgiftForm.css';

interface KontrollavgiftFormProps {
  user: any;
  onLogout?: () => void;
}

interface FormData {
  bolag: string;
  ocr: string;
  utfardat: string;
  regnr: string;
  fabrikat: string;
  from: string;
  to: string;
  plats: string;
  belopp: string;
  overtr: string;
  vagmark: string;
  vagmarken: string;
  foto: string;
}

const KontrollavgiftForm: React.FC<KontrollavgiftFormProps> = ({ user, onLogout }) => {
  const [formData, setFormData] = useState<FormData>({
    bolag: 'Säby Kulle Backe ekonomisk förening',
    ocr: '10000',
    utfardat: '',
    regnr: '',
    fabrikat: '',
    from: '',
    to: '',
    plats: '',
    belopp: '700',
    overtr: '',
    vagmark: 'JA',
    vagmarken: 'JA',
    foto: 'JA'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const today = new Date();
    const timeString = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
    const dateString = today.toISOString().slice(0, 10);
    
    // Hämta senaste OCR-numret från databasen
    const fetchLatestOcr = async () => {
      try {
        const q = query(collection(db, 'kontrollavgifter'), orderBy('createdAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const latestBot = querySnapshot.docs[0].data();
          const latestOcr = parseInt(latestBot.ocr || '10000');
          setFormData(prev => ({
            ...prev,
            ocr: (latestOcr + 1).toString(),
            from: `${dateString} ${timeString}`,
            to: `${dateString} ${timeString}`
          }));
        } else {
          // Om inga böter finns, börja med 10000
          setFormData(prev => ({
            ...prev,
            ocr: '10000',
            from: `${dateString} ${timeString}`,
            to: `${dateString} ${timeString}`
          }));
        }
      } catch (error) {
        console.error('Error fetching latest OCR:', error);
        // Fallback till 10000 om det blir fel
        setFormData(prev => ({
          ...prev,
          ocr: '10000',
          from: `${dateString} ${timeString}`,
          to: `${dateString} ${timeString}`
        }));
      }
    };
    
    fetchLatestOcr();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Förhindra ändring av OCR-fältet
    if (id === 'ocr') return;
    
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };





  const printViaTM = async () => {
    // Spara först till databasen
    setLoading(true);
    try {
      await addDoc(collection(db, 'kontrollavgifter'), {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        status: 'skriven ut'
      });
      
      // Öka OCR-numret automatiskt
      const currentOcr = parseInt(formData.ocr);
      setFormData(prev => ({
        ...prev,
        ocr: (currentOcr + 1).toString()
      }));
      
      setMessage('Kontrollavgift sparad och skickad till skrivare!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      setMessage('Fel vid sparande');
      setLoading(false);
      return;
    }
    setLoading(false);

    // Skicka till TM Print Assistant
    const appscheme = 'tmprintassistant://';
    const host = 'tmprintassistant.epson.com/';
    const action = 'print?';
    
    const xmlData = buildXMLTicket(formData);
    const url = `${appscheme}${host}${action}success=${encodeURIComponent(window.location.href)}&ver=1&data-type=eposprintxml&reselect=yes&cut=feed&data=${encodeURIComponent(xmlData)}`;
    
    window.location.href = url;
  };

  const buildXMLTicket = (v: FormData) => {
    const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const nl = '&#10;';

    let xml = '';
    xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">' + nl;
    xml += '<text align="center"/>' + nl;
    xml += `<text>${esc(v.bolag.toUpperCase())} ${nl}</text>`;
    xml += '<text align="left"/>' + nl;
    xml += `<text> ${nl}</text>`;

    xml += `<text>KONTROLLAVGIFT ${nl}</text>`;
    xml += `<text>-------------------------------- ${nl}</text>`;
    xml += `<text>Ärendenr/OCR: ${esc(v.ocr)} ${nl}</text>`;
    xml += `<text>Utfärdat av: ${esc(v.utfardat)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;

    xml += `<text>Reg.nr: ${esc(v.regnr.toUpperCase())} ${nl}</text>`;
    xml += `<text>Fabrikat: ${esc(v.fabrikat)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Från:  ${esc(v.from)} ${nl}</text>`;
    xml += `<text>Till:  ${esc(v.to)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Plats: ${esc(v.plats)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Belopp: ${esc(v.belopp)} kr ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Överträdelse: ${esc(v.overtr)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Vägmarkering kontrollerad: ${esc(v.vagmark)} ${nl}</text>`;
    xml += `<text>Vägmärken kontrollerade: ${esc(v.vagmarken)} ${nl}</text>`;
    xml += `<text>Foto taget: ${esc(v.foto)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>-------------------------------- ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Autogiro: 5815-6332 ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>-------------------------------- ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Angivna bestämmelser har överträtts.${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Derför uttages en kontrollavgift med belopp     enligt ovan${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Vid betalning via autogiro ska OCR enges.${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Aviften emotses inom 8 dagar${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Eventuella invändningar ska göras till          forvaltning@resona.se${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Scanna för att betala:${nl}</text>`;
    xml += `<qr>{"uqr":1,"tp":1,"nme":"Säby Kulle Backe ekonomisk förening ","iref":"${esc(v.ocr)}","due":${esc(v.belopp)},"pt":"BG","acc":"5815-6332"}</qr>${nl}`;
    xml += '<cut type="full"/>' + nl;
    xml += '</epos-print>';
    return xml;
  };

  return (
    <div className="container">
              <div className="header">
          <div className="header-content">
            <div>
              <h1>🚗 Kontrollavgift</h1>
              <p>Skapa och skriv ut parkeringsböter via TM Print Assistant</p>
              <small style={{ color: '#666', fontSize: '0.8rem' }}>v3.0</small>
            </div>
            <div className="user-info">
              <span>Inloggad som: {user.email}</span>
            </div>
          </div>
        </div>

      <div className="form-container">
        {message && <div className="message">{message}</div>}

        {/* Företagsinformation */}
        <div className="form-section">
          <h2 className="section-title">🏢 Företagsinformation</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Bolag</label>
              <input
                id="bolag"
                value={formData.bolag}
                onChange={handleInputChange}
                placeholder="Ange företagsnamn"
              />
            </div>
            <div className="form-group">
              <label>Ärendenr/OCR</label>
              <input
                id="ocr"
                value={formData.ocr}
                readOnly
                style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                placeholder="Automatiskt genererat"
              />
            </div>
            <div className="form-group">
              <label>Utfärdat av</label>
              <input
                id="utfardat"
                value={formData.utfardat}
                onChange={handleInputChange}
                placeholder="Ange namn på utfärdare"
              />
            </div>
          </div>
        </div>

        {/* Fordonsuppgifter */}
        <div className="form-section">
          <h2 className="section-title">🚙 Fordonsuppgifter</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Registreringsnummer</label>
              <input
                id="regnr"
                value={formData.regnr}
                onChange={handleInputChange}
                placeholder="LJA46J"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label>Fabrikat</label>
              <input
                id="fabrikat"
                value={formData.fabrikat}
                onChange={handleInputChange}
                placeholder="TESLA"
              />
            </div>
          </div>
        </div>

        {/* Tidsuppgifter */}
        <div className="form-section">
          <h2 className="section-title">⏰ Tidsuppgifter</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Från (YYYY-MM-DD HH:MM)</label>
              <input
                id="from"
                value={formData.from}
                onChange={handleInputChange}
                placeholder="2024-04-25 18:23"
              />
            </div>
            <div className="form-group">
              <label>Till (YYYY-MM-DD HH:MM)</label>
              <input
                id="to"
                value={formData.to}
                onChange={handleInputChange}
                placeholder="2024-04-25 18:35"
              />
            </div>
          </div>
        </div>

        {/* Plats och belopp */}
        <div className="form-section">
          <h2 className="section-title">📍 Plats & Belopp</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Plats</label>
              <input
                id="plats"
                value={formData.plats}
                onChange={handleInputChange}
                placeholder="Stockholmsvägen 43"
              />
            </div>
            <div className="form-group">
              <label>Belopp (kr)</label>
              <input
                id="belopp"
                type="number"
                value={formData.belopp}
                onChange={handleInputChange}
                placeholder="700"
              />
            </div>
          </div>
        </div>

        {/* Överträdelse */}
        <div className="form-section">
          <h2 className="section-title">⚠️ Överträdelse</h2>
          <div className="form-group">
            <label>Typ av överträdelse</label>
            <select id="overtr" value={formData.overtr} onChange={handleInputChange}>
              <option value="">Välj överträdelse...</option>
              <option value="Ej parkerat inom markerad plats">Ej parkerat inom markerad plats</option>
              <option value="Parkering längre än tillåten/betald">Parkering längre än tillåten/betald</option>
              <option value="Parkeringsavgift ej erlagd">Parkeringsavgift ej erlagd</option>
              <option value="Parkeringsbiljett saknas/ej synlig">Parkeringsbiljett saknas/ej synlig</option>
              <option value="Parkeringsbiljett felvänd/ej läsbar">Parkeringsbiljett felvänd/ej läsbar</option>
              <option value="Parkeringstillstånd saknas/synligt">Parkeringstillstånd saknas/synligt</option>
              <option value="Ej giltigt parkeringstillstånd">Ej giltigt parkeringstillstånd</option>
              <option value="Parkering förhyrd/reserverad plats">Parkering förhyrd/reserverad plats</option>
              <option value="Stannande/parkering i parkeringsplats för rörelsehindrade, saknar parkeringstillstånd">Stannande/parkering i parkeringsplats för rörelsehindrade, saknar parkeringstillstånd</option>
              <option value="Parkering i parkeringsplats reserverad för visst fordonsslag">Parkering i parkeringsplats reserverad för visst fordonsslag</option>
              <option value="Parkeringsskiva saknas/ej synlig">Parkeringsskiva saknas/ej synlig</option>
              <option value="Parkeringsskiva felvänd/ej avläsbar">Parkeringsskiva felvänd/ej avläsbar</option>
              <option value="Förbud att parkera. Område.">Förbud att parkera. Område.</option>
              <option value="Förbud att parkera.">Förbud att parkera.</option>
              <option value="Övrig orsak enligt anteckning på Kontrollavgiftsfakturan">Övrig orsak enligt anteckning på Kontrollavgiftsfakturan</option>
            </select>
          </div>
        </div>

        {/* Kontrolluppgifter */}
        <div className="form-section">
          <h2 className="section-title">✅ Kontrolluppgifter</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Vägmarkering kontrollerad</label>
              <input
                id="vagmark"
                value={formData.vagmark}
                onChange={handleInputChange}
                placeholder="JA"
              />
            </div>
            <div className="form-group">
              <label>Vägmärken kontrollerade</label>
              <input
                id="vagmarken"
                value={formData.vagmarken}
                onChange={handleInputChange}
                placeholder="JA"
              />
            </div>
            <div className="form-group">
              <label>Foto taget</label>
              <input
                id="foto"
                value={formData.foto}
                onChange={handleInputChange}
                placeholder="JA"
              />
            </div>
          </div>
        </div>



        {/* Knappar */}
        <div className="button-group">
          <button 
            className="print-button" 
            onClick={printViaTM}
            disabled={loading}
          >
            {loading ? 'Sparar och skriver ut...' : '🖨️ Skriv ut via TM Print Assistant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default KontrollavgiftForm;
