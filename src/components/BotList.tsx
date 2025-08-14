import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './BotList.css';

interface Bot {
  id: string;
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
  userEmail: string;
  createdAt: any;
  status: string;
  paymentStatus?: string;
}

interface BotListProps {
  user: any;
}

const BotList: React.FC<BotListProps> = ({ user }) => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  const fetchBots = useCallback(async () => {
    setLoading(true);
    try {
      let q;
      
      if (filter === 'all') {
        q = query(collection(db, 'kontrollavgifter'), orderBy('createdAt', 'desc'));
      } else {
        const now = new Date();
        let startDate = new Date();
        
        switch (filter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        q = query(
          collection(db, 'kontrollavgifter'),
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const botsData: Bot[] = [];
      
      querySnapshot.forEach((doc) => {
        botsData.push({
          id: doc.id,
          ...doc.data()
        } as Bot);
      });
      
      setBots(botsData);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('sv-SE');
  };

  const getTotalAmount = () => {
    return bots.reduce((sum, bot) => sum + parseInt(bot.belopp || '0'), 0);
  };

  const getPaymentStatus = (bot: Bot) => {
    if (bot.paymentStatus) {
      return bot.paymentStatus;
    }
    
    // Beräkna om boten är förfallen (8 dagar efter skapande)
    const createdAt = bot.createdAt?.toDate ? bot.createdAt.toDate() : new Date(bot.createdAt);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 8);
    const now = new Date();
    
    if (now > dueDate) {
      return 'förfallen';
    }
    
    return 'ej betald';
  };

  const getDaysUntilDue = (bot: Bot) => {
    const createdAt = bot.createdAt?.toDate ? bot.createdAt.toDate() : new Date(bot.createdAt);
    const dueDate = new Date(createdAt);
    dueDate.setDate(dueDate.getDate() + 8);
    const now = new Date();
    
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'betald':
        return '#27ae60';
      case 'inkasso':
        return '#e74c3c';
      case 'förfallen':
        return '#e67e22';
      case 'ej betald':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const updatePaymentStatus = async (botId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'kontrollavgifter', botId), {
        paymentStatus: newStatus
      });
      // Uppdatera lokalt state
      setBots(prev => prev.map(bot => 
        bot.id === botId ? { ...bot, paymentStatus: newStatus } : bot
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteBot = async (botId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna kontrollavgift?')) {
      try {
        await deleteDoc(doc(db, 'kontrollavgifter', botId));
        setBots(prev => prev.filter(bot => bot.id !== botId));
      } catch (error) {
        console.error('Error deleting bot:', error);
      }
    }
  };

  const printBotAgain = (bot: Bot) => {
    const appscheme = 'tmprintassistant://';
    const host = 'tmprintassistant.epson.com/';
    const action = 'print?';
    
    const xmlData = buildXMLTicket(bot);
    const url = `${appscheme}${host}${action}success=${encodeURIComponent(window.location.href)}&ver=1&data-type=eposprintxml&reselect=yes&cut=feed&data=${encodeURIComponent(xmlData)}`;
    
    window.location.href = url;
  };

  const buildXMLTicket = (bot: Bot) => {
    const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const nl = '&#10;';

    let xml = '';
    xml += '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">' + nl;
    xml += '<text align="center"/>' + nl;
    xml += `<text>${esc(bot.bolag.toUpperCase())} ${nl}</text>`;
    xml += '<text align="left"/>' + nl;
    xml += `<text> ${nl}</text>`;

    xml += `<text>KONTROLLAVGIFT ${nl}</text>`;
    xml += `<text>-------------------------------- ${nl}</text>`;
    xml += `<text>Ärendenr/OCR: ${esc(bot.ocr)} ${nl}</text>`;
    xml += `<text>Utfärdat av: ${esc(bot.utfardat)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;

    xml += `<text>Reg.nr: ${esc(bot.regnr.toUpperCase())} ${nl}</text>`;
    xml += `<text>Fabrikat: ${esc(bot.fabrikat)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Från:  ${esc(bot.from)} ${nl}</text>`;
    xml += `<text>Till:  ${esc(bot.to)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Plats: ${esc(bot.plats)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Belopp: ${esc(bot.belopp)} kr ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Överträdelse: ${esc(bot.overtr)} ${nl}</text>`;
    xml += `<text> ${nl}</text>`;
    xml += `<text>Vägmarkering kontrollerad: ${esc(bot.vagmark)} ${nl}</text>`;
    xml += `<text>Vägmärken kontrollerade: ${esc(bot.vagmarken)} ${nl}</text>`;
    xml += `<text>Foto taget: ${esc(bot.foto)} ${nl}</text>`;
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
    xml += `<qr>${esc(bot.ocr)}_${esc(bot.belopp)}_5815-6332</qr>${nl}`;
    xml += `<text>QR: ${esc(bot.ocr)}_${esc(bot.belopp)}_5815-6332</text>${nl}`;
    xml += '<cut type="full"/>' + nl;
    xml += '</epos-print>';
    return xml;
  };

  if (loading) {
    return (
      <div className="bot-list-container">
        <div className="loading">Laddar böter...</div>
      </div>
    );
  }

  return (
    <div className="bot-list-container">
      <div className="bot-list-header">
        <h2>📋 Lista över kontrollavgifter</h2>
        <small style={{ color: '#666', fontSize: '0.8rem' }}>v3.0</small>
        <div className="filter-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Alla</option>
            <option value="today">Idag</option>
            <option value="week">Senaste veckan</option>
            <option value="month">Senaste månaden</option>
          </select>
        </div>
      </div>

      <div className="stats">
        <div className="stat-item">
          <span className="stat-label">Antal böter:</span>
          <span className="stat-value">{bots.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Totalt belopp:</span>
          <span className="stat-value">{getTotalAmount()} kr</span>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="no-bots">
          <p>Inga kontrollavgifter hittades.</p>
        </div>
      ) : (
        <div className="bots-grid">
          {bots.map((bot) => {
            const paymentStatus = getPaymentStatus(bot);
            const statusColor = getStatusColor(paymentStatus);
            const daysUntilDue = getDaysUntilDue(bot);
            
            return (
              <div key={bot.id} className="bot-card">
                <div className="bot-header">
                  <div className="bot-title">
                    <h3>🚗 {bot.regnr}</h3>
                    <span className="bot-id">#{bot.id.slice(-6)}</span>
                  </div>
                  <div className="status-container">
                    <span className="status-print">
                      {bot.status || 'skriven ut'}
                    </span>
                    <span 
                      className="status-payment"
                      style={{ backgroundColor: statusColor }}
                    >
                      {paymentStatus.toUpperCase()}
                    </span>
                    {paymentStatus === 'ej betald' && daysUntilDue > 0 && (
                      <span className="due-date-tag">
                        Förfaller om {daysUntilDue} {daysUntilDue === 1 ? 'dag' : 'dagar'}
                      </span>
                    )}
                    {paymentStatus === 'förfallen' && (
                      <span className="due-date-tag overdue">
                        Förfallen för {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? 'dag' : 'dagar'} sedan
                      </span>
                    )}
                  </div>
                </div>
                
                                 <div className="bot-content">
                   <div className="bot-main-info">
                     <div className="bot-amount">
                       <span className="amount-label">Belopp</span>
                       <span className="amount-value">{bot.belopp} kr</span>
                     </div>
                     <div className="bot-location">
                       <span className="location-icon">📍</span>
                       <span className="location-text">{bot.plats}</span>
                     </div>
                   </div>
                   
                   <div className="bot-details">
                     <div className="detail-item">
                       <span className="detail-label">Överträdelse:</span>
                       <span className="detail-value">{bot.overtr}</span>
                     </div>
                     <div className="detail-item">
                       <span className="detail-label">OCR:</span>
                       <span className="detail-value">{bot.ocr}</span>
                     </div>
                     <div className="detail-item">
                       <span className="detail-label">Skapad:</span>
                       <span className="detail-value">{formatDate(bot.createdAt)}</span>
                     </div>
                     <div className="detail-item">
                       <span className="detail-label">Av:</span>
                       <span className="detail-value">{bot.userEmail}</span>
                     </div>
                   </div>



                   <div className="bot-actions">
                     <div className="status-selector">
                       <label>Betalningsstatus:</label>
                       <select 
                         value={paymentStatus} 
                         onChange={(e) => updatePaymentStatus(bot.id, e.target.value)}
                       >
                         <option value="ej betald">Ej betald</option>
                         <option value="betald">Betald</option>
                         <option value="inkasso">Inkasso</option>
                         <option value="förfallen">Förfallen</option>
                       </select>
                     </div>
                     
                     <div className="action-buttons">
                       <button 
                         className="print-again-btn"
                         onClick={() => printBotAgain(bot)}
                       >
                         🖨️ Skriv ut igen
                       </button>
                       <button 
                         className="delete-btn"
                         onClick={() => deleteBot(bot.id)}
                       >
                         🗑️ Ta bort
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BotList;
