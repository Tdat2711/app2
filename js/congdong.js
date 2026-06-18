// js/congdong.js
import { showToast, generateId } from './utils.js';
import { getUserFriends, saveUserFriends, getUserGroups, saveUserGroups } from './data.js';
import { getCurrentUser } from './app.js';

var friends = [];
var groups = [];
var currentUser = null;

var leaderboardData = [
  { rank: 1, name: 'minh_hoc99', initials: 'MH', points: 5840, streak: 120, change: '+2', color: 'gold' },
  { rank: 2, name: 'thuylinhh', initials: 'TL', points: 4210, streak: 85, change: '+1', color: 'silver' },
  { rank: 3, name: 'namtran', initials: 'NT', points: 3890, streak: 67, change: '-1', color: 'bronze' },
  { rank: 4, name: 'hoa_anh2k4', initials: 'HA', points: 3610, streak: 42, change: '+2', color: 'blue' },
  { rank: 5, name: 'phuongkhanh_', initials: 'PK', points: 3420, streak: 18, change: '0', color: 'purple' },
  { rank: 6, name: 'bao_tran2k5', initials: 'BT', points: 3105, streak: 9, change: '-1', color: 'green' },
  { rank: 7, name: 'duc_long_vn', initials: 'DL', points: 2880, streak: 27, change: '+3', color: 'orange' },
  { rank: 8, name: 'mai_yen_k65', initials: 'MY', points: 2640, streak: 5, change: '-2', color: 'red' },
  { rank: 9, name: 'khanh_hoc24', initials: 'KH', points: 2200, streak: 12, change: '+1', color: 'blue' },
  { rank: 10, name: 'quang_minh', initials: 'QM', points: 1950, streak: 8, change: '0', color: 'purple' }
];

var activityData = [
  { user: 'minh_hoc99', action: 'vừa hoàn thành 120 thẻ Toán Cao Cấp', time: '2 phút trước', color: 'green' },
  { user: 'hoa_anh2k4', action: 'đạt streak 42 ngày liên tiếp 🔥', time: '15 phút trước', color: 'orange' },
  { user: 'namtran', action: 'chia sẻ bộ thẻ IELTS Writing Band 8', time: '1 giờ trước', color: 'purple' }
];

function loadData() {
  friends = getUserFriends();
  groups = getUserGroups();
  currentUser = getCurrentUser();
}

function saveFriends() {
  saveUserFriends(friends);
}

function saveGroups() {
  saveUserGroups(groups);
}

function renderLeaderboard() {
  var container = document.getElementById('rankList');
  if (!container) return;
  var html = '';
  for (var i = 0; i < leaderboardData.length; i++) {
    var user = leaderboardData[i];
    var isMe = (i === 7);
    var changeClass = user.change === '+2' ? 'change-up' : (user.change === '-1' ? 'change-down' : 'change-same');
    var changeIcon = user.change === '+2' ? 'fa-arrow-up' : (user.change === '-1' ? 'fa-arrow-down' : 'fa-minus');
    html += '<div class="rank-item ' + (isMe ? 'is-me' : '') + '">' +
      '<span class="rank-number">' + user.rank + '</span>' +
      '<div class="rank-avatar ' + user.color + '">' + user.initials + '</div>' +
      '<div class="rank-info"><div class="rank-name">' + user.name + (isMe ? ' 👈 Bạn' : '') + '</div><div class="rank-meta">' + user.streak + ' ngày streak</div></div>' +
      '<div class="rank-stats"><div class="rank-points">' + user.points + '</div><div class="rank-change ' + changeClass + '"><i class="fas ' + changeIcon + '"></i> ' + user.change + '</div></div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function renderActivity() {
  var container = document.getElementById('activityList');
  if (!container) return;
  var html = '';
  for (var i = 0; i < activityData.length; i++) {
    var item = activityData[i];
    html += '<div class="activity-item">' +
      '<div class="activity-dot ' + item.color + '"></div>' +
      '<div><div class="activity-text"><strong>' + item.user + '</strong> ' + item.action + '</div><div class="activity-time">' + item.time + '</div></div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function renderFriends() {
  var container = document.getElementById('friendsList');
  if (!container) return;
  if (friends.length === 0) {
    container.innerHTML = '<p style="color:var(--text-gray);text-align:center;padding:20px;">Chưa có bạn bè.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < friends.length; i++) {
    var f = friends[i];
    html += '<div class="friend-item">' +
      '<div class="friend-info">' +
        '<div class="friend-avatar" style="background:' + (f.color || '#4f46e5') + '">' + f.initials + '</div>' +
        '<div><div class="friend-name">' + f.name + '</div><div class="friend-email">' + f.email + '</div></div>' +
      '</div>' +
      '<div class="friend-actions">' +
        '<button class="btn btn-outline btn-sm" onclick="window.removeFriend(\'' + f.id + '\')">Xóa</button>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function addFriend(emailOrName) {
  var newFriend = {
    id: generateId('F'),
    name: emailOrName,
    email: emailOrName + '@example.com',
    initials: emailOrName.substring(0,2).toUpperCase(),
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0')
  };
  friends.push(newFriend);
  saveFriends();
  renderFriends();
  showToast('Đã thêm bạn: ' + newFriend.name, 'success');
}

function removeFriend(id) {
  if (!confirm('Xóa bạn này?')) return;
  var newList = [];
  for (var i = 0; i < friends.length; i++) {
    if (friends[i].id !== id) newList.push(friends[i]);
  }
  friends = newList;
  saveFriends();
  renderFriends();
  showToast('Đã xóa bạn', 'success');
}

function renderGroups() {
  var container = document.getElementById('groupsList');
  if (!container) return;
  if (groups.length === 0) {
    container.innerHTML = '<p style="color:var(--text-gray);text-align:center;padding:20px;">Chưa có nhóm nào.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    var isMember = g.members.indexOf(currentUser ? currentUser.id : null) !== -1;
    html += '<div class="group-item">' +
      '<div class="group-info">' +
        '<div class="group-avatar" style="background:' + (g.color || '#8b5cf6') + '">' + (g.icon || '👥') + '</div>' +
        '<div><div class="group-name">' + g.name + '</div><div class="group-members">' + g.members.length + ' thành viên</div></div>' +
      '</div>' +
      '<div class="group-actions">' +
        (isMember ? '<button class="btn btn-outline btn-sm" onclick="window.leaveGroup(\'' + g.id + '\')">Rời nhóm</button>' :
                    '<button class="btn btn-primary btn-sm" onclick="window.joinGroup(\'' + g.id + '\')">Tham gia</button>') +
        (g.creator === (currentUser ? currentUser.id : null) ? '<button class="btn btn-danger btn-sm" onclick="window.deleteGroup(\'' + g.id + '\')">Xóa</button>' : '') +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
}

function createGroup(name, description) {
  var newGroup = {
    id: generateId('G'),
    name: name,
    description: description || '',
    creator: currentUser ? currentUser.id : null,
    members: currentUser ? [currentUser.id] : [],
    createdAt: new Date().toISOString(),
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),
    icon: '👥'
  };
  groups.push(newGroup);
  saveGroups();
  renderGroups();
  showToast('Đã tạo nhóm "' + name + '"', 'success');
}

function joinGroup(groupId) {
  var group = null;
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].id === groupId) { group = groups[i]; break; }
  }
  if (!group) return;
  if (!currentUser) return;
  if (group.members.indexOf(currentUser.id) !== -1) { showToast('Bạn đã ở trong nhóm', 'info'); return; }
  group.members.push(currentUser.id);
  saveGroups();
  renderGroups();
  showToast('Đã tham gia nhóm "' + group.name + '"', 'success');
}

function leaveGroup(groupId) {
  var group = null;
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].id === groupId) { group = groups[i]; break; }
  }
  if (!group) return;
  if (!currentUser) return;
  if (group.creator === currentUser.id) { showToast('Không thể rời nhóm do bạn là người tạo', 'error'); return; }
  var newMembers = [];
  for (var j = 0; j < group.members.length; j++) {
    if (group.members[j] !== currentUser.id) newMembers.push(group.members[j]);
  }
  group.members = newMembers;
  saveGroups();
  renderGroups();
  showToast('Đã rời nhóm "' + group.name + '"', 'success');
}

function deleteGroup(groupId) {
  if (!confirm('Xóa nhóm này?')) return;
  var newList = [];
  for (var i = 0; i < groups.length; i++) {
    if (groups[i].id !== groupId) newList.push(groups[i]);
  }
  groups = newList;
  saveGroups();
  renderGroups();
  showToast('Đã xóa nhóm', 'success');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('rankList')) {
    loadData();
    renderLeaderboard();
    renderActivity();
    renderFriends();
    renderGroups();

    var tabBtns = document.querySelectorAll('.ctab-btn');
    for (var i = 0; i < tabBtns.length; i++) {
      tabBtns[i].addEventListener('click', function() {
        var btns = document.querySelectorAll('.ctab-btn');
        for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
        this.classList.add('active');
        var panes = document.querySelectorAll('.tab-pane');
        for (var k = 0; k < panes.length; k++) panes[k].classList.remove('active');
        document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      });
    }

    document.getElementById('addFriendBtn').addEventListener('click', function() { openModal('addFriendModal'); });
    document.getElementById('closeAddFriend').addEventListener('click', function() { closeModal('addFriendModal'); });
    document.getElementById('cancelAddFriend').addEventListener('click', function() { closeModal('addFriendModal'); });
    document.getElementById('confirmAddFriend').addEventListener('click', function() {
      var val = document.getElementById('friendInput').value.trim();
      if (!val) { showToast('Vui lòng nhập tên hoặc email', 'error'); return; }
      addFriend(val);
      document.getElementById('friendInput').value = '';
      closeModal('addFriendModal');
    });

    document.getElementById('createGroupBtn').addEventListener('click', function() { openModal('createGroupModal'); });
    document.getElementById('closeCreateGroup').addEventListener('click', function() { closeModal('createGroupModal'); });
    document.getElementById('cancelCreateGroup').addEventListener('click', function() { closeModal('createGroupModal'); });
    document.getElementById('confirmCreateGroup').addEventListener('click', function() {
      var name = document.getElementById('groupNameInput').value.trim();
      var desc = document.getElementById('groupDescInput').value.trim();
      if (!name) { showToast('Vui lòng nhập tên nhóm', 'error'); return; }
      createGroup(name, desc);
      document.getElementById('groupNameInput').value = '';
      document.getElementById('groupDescInput').value = '';
      closeModal('createGroupModal');
    });
  }
});

window.removeFriend = removeFriend;
window.joinGroup = joinGroup;
window.leaveGroup = leaveGroup;
window.deleteGroup = deleteGroup;