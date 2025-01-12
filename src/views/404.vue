<template>
    <div class="not-found">
      <h1>404</h1>
      <p>您所访问的页面不存在</p>
      <div class="navigation">
        <router-link to="/">返回首页</router-link>
      </div>
    </div>
  </template>
  
  <style scoped>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }
  
  h1 {
    font-size: 96px;
    color: #333333;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 24px;
    color: #999999;
    margin-bottom: 32px;
  }
  
  .navigation {
    display: flex;
    justify-content: center;
    gap: 24px;
  }
  
  .router-link {
    font-size: 18px;
    color: #666666;
    text-decoration: none;
    padding: 8px 16px;
    border: 1px solid #666666;
    border-radius: 4px;
    transition: background-color 0.3s ease-out;
  }
  
  .router-link:hover {
    background-color: #666666;
    color: #ffffff;
  }
  </style>v