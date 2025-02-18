import { PageHeading } from './../../model/page-heading';
import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { GuardsCheckEnd, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { getTestConnectAction } from 'src/app/actions/coin.action';
import { setPageHeading } from 'src/app/actions/header.action';
import { AuthDetail } from 'src/app/common/util/auth-detail';
import { DateUtils } from 'src/app/common/util/date.util';
import { ValidationUtil } from 'src/app/common/util/validation.util';
import { Menu } from 'src/app/model/menu.model';
import { ResultModel } from 'src/app/model/result.model';
import { AuthState, getCartNumber } from 'src/app/selectors/auth.selector';
import { CoinState, getTestConnect } from 'src/app/selectors/coin.selector';
import { HeaderState, getIsHeader } from 'src/app/selectors/header.selector';
import { CartService } from 'src/app/service/cart-service.service';

declare var initHeader: any;  // Khai báo jQuery
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  subMenu: any = [];
  isHeader$ = new Observable<Boolean>();
  isHeader: boolean = true;
  isLogin: boolean = AuthDetail.isLogin();
  wellcome: string = ''
  isConnect:boolean = false;
  resultConnect$ =  new Observable<ResultModel>();
  quantityCart$ = new Observable<number>();
  quantityCart :number = 0;
  isPopupOpen = false;
  // Biến để kiểm soát trạng thái mobile menu
  isMobileMenuOpen = false;
  menus: Menu[] = [
    {
      label:'About',
      items : [
        {label : 'Team' , route : '/about/team'},
        {label : 'Testimonials' , route : '/about/testimonials'}
      ]
    },
    {
      label:'Contact',
      route:'/about/contact',
    },
  ];
  currentPath: string = '';



  constructor(private headerStore: Store<HeaderState>,private authStore: Store<AuthState>,
    private router: Router, private cartService: CartService,private renderer: Renderer2,
    private el: ElementRef ,
    private coinStore: Store<CoinState>) {
    this.isHeader$ = this.headerStore.select(getIsHeader);
    this.resultConnect$ = this.coinStore.select(getTestConnect);
    this.quantityCart$ = this.authStore.select(getCartNumber)
  }
  ngOnInit(): void {
    const overlay = this.el.nativeElement.querySelector('.mobile-menu-overlay');
    if (overlay) {
      this.renderer.listen(overlay, 'click', () => {
        this.closeMobileMenu();
      });
    }
    setTimeout(() => {
      initHeader()
    }, 500);
    let role  = String(AuthDetail.getLoginedInfo()?.role);
    if(this.isLogin){
      this.menus.push(
      {
        label:'Wishlist',
        route:'/shopping/wishlist',
        kind:'mt',
        icon:'icon-heart-o'
      },
      {
        label:'View Cart',
        route:'/shopping/cart',
        kind:'mt'
      },
      {
        label:'Checkout',
        route:'/shopping/checkout'  ,
        kind:'mt'
      },
      {
        label:'Account',
        route:'/auth/my-account',
        kind:'mt',
        icon:'icon-user'
      },
    )
    }
    if(role == 'admin'){
      this.menus.push({
        label: 'Administrator',
        items: [
          {label : "Quản Lý Dịch Vụ" , route: '/shopping/newProduct' , isShowPageHeading:true },
          {label : "Đăng Ký Danh Mục Dịch Vụ " , route: '/product/regcate'  , isShowPageHeading:true},
          {label: 'Theo Dõi Đơn Hàng Dịch Vụ', route: '/shopping/order-tracking'  , isShowPageHeading:true},
          {label: 'Chi Tiết Dịch Vụ', route: '/shopping/order-detail'  , isShowPageHeading:true},
          {label: 'Thêm Mới Bài Viết', route: '/blog/blog-edit'  , isShowPageHeading:true},
          {label: 'Quản Lý Bài Viết', route: '/blog/blog-admin'  , isShowPageHeading:true},
          {label: 'Quản Lý Tin Nhắn', route: '/chat-admin'  , isShowPageHeading:true},
        ]
      })
    }
    this.initMenu(window.location.pathname );
    if(Number(AuthDetail.getLoginedInfo()?.logoutDate) <= Number(DateUtils.getCurrFullDateTimeStrBlank(new Date()))){
      AuthDetail.actionLogOut();
      window.location.href = '/';
    }
    if (this.isLogin) {
      this.wellcome = "Wellcome to " + String(AuthDetail.getLoginedInfo()?.email)
    }
    this.isHeader$.subscribe(res => {
      if (ValidationUtil.isNotNullAndNotEmpty(res)) {
        this.isHeader = Boolean(res)
      } else {
        this.isHeader = true;
      }
    })
    this.quantityCart = this.cartService.getCart(String(AuthDetail.getLoginedInfo()?.id)).length;
    this.quantityCart$.subscribe(res => {
        this.quantityCart = res;
    })
  }
  findChildrenByName(menuData: any, categoryName: any) {
    for (const category of menuData) {
      if (category.name === categoryName) {
        return category.children;
      } else {
        for (const subCategory of category.children) {
          if (subCategory.name === categoryName) {
            return subCategory.children;
          }
        }
      }
    }
    return null;
  }
  logOut() {
    AuthDetail.actionLogOut();
    window.location.href = "/"
  }
  findMenuPath(route: string): string {
    let path: string[] = [];
    const searchMenu = (menuArray: Menu[], parentLabel?: string) => {
      for (const menu of menuArray) {
        if (menu.route === route) {
          if (parentLabel) {
            path.push(parentLabel);
          }
          path.push(menu.label);
          return true;
        }
        if (menu.items && menu.items.length > 0) {
          for (const subItem of menu.items) {
            if (subItem.route === route) {
              if (parentLabel) {
                path.push(parentLabel);
              }
              path.push(menu.label);
              path.push(subItem.label);
              return true;
            }
            if (subItem.items && subItem.items.length > 0) {
              if (searchMenu(subItem.items, subItem.label)) {
                path.unshift(menu.label);
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    searchMenu(this.menus);
    return path.length ? path.join(' > ') : 'Not Found';
  }
  onMenuClick(menu: Menu): void {
    if(ValidationUtil.isNotNullAndNotEmpty(menu.route)){
      this.closeMobileMenu();
      this.currentPath = this.findMenuPath(String(menu.route));
    }
    let isShow  = menu.isShowPageHeading;
    if(isShow == undefined){
      isShow = true;
    }
    const pageHeading : PageHeading = {
      chilren:this.currentPath,
      isShow: isShow ,
      menu: menu
    }
    this.headerStore.dispatch(setPageHeading({pageHeading:pageHeading}))
  }

  initMenu(url:string){
    const menus = this.menus;
    let result: Menu | undefined;
    const search = (menuArray: Menu[]): Menu | undefined => {
      for (const menu of menuArray) {
        if (menu.route && url && menu.route.toLowerCase() === url.toLowerCase()) {
          return menu;
        }
        if (menu.items && menu.items.length > 0) {
          result = search(menu.items);
          if (result) {
            return result;
          }
        }
      }
      return undefined;
    };
    const menu = search(menus);
    this.onMenuClick(menu as Menu)


  }
  closePopup(): void {
    this.isPopupOpen = false;
  }
 openMobileMenu() {
  const overlay = this.el.nativeElement.querySelector('.mobile-menu-overlay');
  const menuContainer = this.el.nativeElement.querySelector('.mobile-menu-container');

  if (overlay && menuContainer) {
    this.renderer.setStyle(overlay, 'display', 'block');
    this.renderer.addClass(menuContainer, 'open');
    this.isMobileMenuOpen = true;
  } else {
    console.error('Không tìm thấy phần tử .mobile-menu-overlay hoặc .mobile-menu-container');
  }
}
closeMobileMenu() {
  const overlay = this.el.nativeElement.querySelector('.mobile-menu-overlay');
  const menuContainer = this.el.nativeElement.querySelector('.mobile-menu-container');
  if (overlay && menuContainer) {
    this.renderer.setStyle(overlay, 'display', 'none');
    this.renderer.removeClass(menuContainer, 'open');
    this.isMobileMenuOpen = false;
  } else {
    console.error('Không tìm thấy phần tử .mobile-menu-overlay hoặc .mobile-menu-container');
  }
}

toggleMenu(menuItem: HTMLLIElement , menu: Menu): void {

  this.onMenuClick(menu);
  if (menuItem.classList.contains('open')) {
    this.renderer.removeClass(menuItem, 'open');
  } else {
    this.renderer.addClass(menuItem, 'open');
  }
}







preventDefault(event: Event): void {
  event.preventDefault(); // Ngăn chuyển hướng
}
}


