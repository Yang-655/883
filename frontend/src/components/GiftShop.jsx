import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GiftShop.css';

const GiftShop = ({ user, onBack }) => {
  const [gifts, setGifts] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [showRecharge, setShowRecharge] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
    fetchUserBalance();
  }, []);

  const fetchGifts = async () => {
    try {
      const response = await axios.get('/api/gifts');
      setGifts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('获取礼物列表失败:', error);
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await axios.get('/api/gifts/balance');
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error('获取用户余额失败:', error);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    try {
      const response = await axios.post('/api/gifts/recharge', {
        amount: parseInt(rechargeAmount)
      });
      
      setUserBalance(response.data.balance);
      setRechargeAmount('');
      setShowRecharge(false);
      alert('充值成功！');
    } catch (error) {
      console.error('充值失败:', error);
      alert('充值失败：' + (error.response?.data?.message || '未知错误'));
    }
  };

  const formatPrice = (price) => {
    return price.toLocaleString();
  };

  if (loading) {
    return <div className="gift-shop loading">加载中...</div>;
  }

  return (
    <div className="gift-shop">
      <div className="gift-shop-header">
        <button onClick={onBack} className="back-button">返回</button>
        <h2>礼物商店</h2>
        <div className="user-balance">
          <span>余额: {formatPrice(userBalance)} 金币</span>
          <button 
            className="recharge-button"
            onClick={() => setShowRecharge(true)}
          >
            充值
          </button>
        </div>
      </div>

      {showRecharge && (
        <div className="recharge-modal">
          <div className="recharge-form">
            <h3>充值金币</h3>
            <div className="form-group">
              <label>充值金额:</label>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="输入充值金额"
              />
            </div>
            <div className="form-actions">
              <button onClick={() => setShowRecharge(false)}>取消</button>
              <button onClick={handleRecharge}>确认充值</button>
            </div>
          </div>
        </div>
      )}

      <div className="gifts-grid">
        {gifts.map(gift => (
          <div key={gift.id} className="gift-card">
            <div className="gift-icon">
              {gift.icon ? (
                <img src={`/gifts/${gift.icon}`} alt={gift.name} />
              ) : (
                <div className="gift-placeholder">🎁</div>
              )}
            </div>
            <div className="gift-info">
              <h3>{gift.name}</h3>
              <p className="gift-description">{gift.description}</p>
              <div className="gift-price">
                <span>{formatPrice(gift.price)} 金币</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GiftShop;