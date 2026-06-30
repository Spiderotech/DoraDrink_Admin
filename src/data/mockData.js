export const roles = {
  super_admin: 'Super Admin',
};

export const roleAccess = {
  super_admin: ['dashboard', 'users', 'competitions', 'leaderboards', 'rewards', 'purchases', 'vouchers', 'notifications', 'analytics'],
};

export const navItems = [
  ['dashboard', 'Dashboard'],
  ['users', 'Users'],
  ['competitions', 'Competitions'],
  ['leaderboards', 'Leaderboards'],
  ['rewards', 'Rewards'],
  ['purchases', 'Purchases'],
  ['vouchers', 'Vouchers'],
  ['notifications', 'Notifications'],
  ['analytics', 'Analytics'],
];

export const metrics = [
  ['Daily active users', '8,430', '+12%', 'good'],
  ['New users today', '472', '+8%', 'good'],
  ['Full completions today', '3,108', '+5%', 'good'],
  ['Average slots completed', '2.41', 'watch', 'warn'],
  ['Coins issued today', '184,250', '+18%', 'warn'],
  ['Diamonds spent today', '6,840', '+6%', 'good'],
  ['Ads watched today', '21,904', '+11%', 'good'],
  ['Active competition joins', '1,284', '+15%', 'good'],
];

export const chartValues = [56, 68, 62, 84, 91, 73, 98, 110, 124, 116, 136, 148];

export const alerts = [
  ['Voucher inventory low', 'Amazon Rank1 vouchers have 8 available codes.', 'warn'],
  ['Competition ending soon', 'Hydration Sprint closes in 6 hours.', 'info'],
  ['Reward issuance spike', 'Coin issuance is 18% above normal range.', 'warn'],
];

export const users = [
  { id: 'u_1024', username: 'Username P', email: 'Username@example.com', country: 'India', city: 'Kochi', coins: 1240, diamonds: 3, energy: 'High', streak: 18, lastActive: '12 min ago', status: 'active' },
  { id: 'u_1025', username: 'Maya R', email: 'maya@example.com', country: 'India', city: 'Bengaluru', coins: 9400, diamonds: 8, energy: 'Medium', streak: 52, lastActive: '1 hr ago', status: 'suspicious' },
  { id: 'u_1026', username: 'Noah L', email: 'noah@example.com', country: 'USA', city: 'Austin', coins: 410, diamonds: 1, energy: 'Low', streak: 4, lastActive: '2 days ago', status: 'inactive' },
  { id: 'u_1027', username: 'Sara K', email: 'sara@example.com', country: 'UAE', city: 'Dubai', coins: 2210, diamonds: 4, energy: 'High', streak: 31, lastActive: '22 min ago', status: 'active' },
];

export const competitions = [
  { id: 'comp_2026_w21', title: 'Weekly Hydration Sprint', status: 'Live', start: '2026-05-25', end: '2026-05-31', fee: '2 diamonds', participants: 1284, rewardStatus: 'Pending' },
  { id: 'comp_2026_w20', title: 'City Streak Challenge', status: 'Closed', start: '2026-05-18', end: '2026-05-24', fee: '1 diamond', participants: 942, rewardStatus: 'Distributed' },
  { id: 'comp_2026_w22', title: 'Global 100 Day Push', status: 'Draft', start: '2026-06-01', end: '2026-06-30', fee: '5 diamonds', participants: 0, rewardStatus: 'Draft' },
];

export const rewards = [
  { id: 'rw_9101', user: 'u_1024', currency: 'coins', amount: '+25', source: 'slot_completion', created: '2026-05-25 08:42', actor: 'system' },
  { id: 'rw_9102', user: 'u_1025', currency: 'coins', amount: '+5000', source: 'manual_adjustment', created: '2026-05-25 09:14', actor: 'admin' },
  { id: 'rw_9103', user: 'u_1027', currency: 'diamonds', amount: '+2', source: 'competition_reward', created: '2026-05-25 10:03', actor: 'system' },
];

export const vouchers = [
  { id: 'vc_120', code: 'AMAZON-****-X2A', category: 'Rank1', competition: 'comp_2026_w20', user: 'u_1027', state: 'claimed', created: '2026-05-24', used: '' },
  { id: 'vc_121', code: 'SPOTIFY-****-7KL', category: 'Rank2', competition: 'comp_2026_w20', user: '', state: 'available', created: '2026-05-24', used: '' },
  { id: 'vc_122', code: 'PLAY-****-9QP', category: 'Rank1', competition: 'comp_2026_w21', user: '', state: 'available', created: '2026-05-25', used: '' },
];
