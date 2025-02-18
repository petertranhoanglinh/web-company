import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { getProducts, ProductState } from '../selectors/product.selector';
import { productAction } from '../actions/product.action';
import { ProductResponseModel } from '../model/product-response.model';
import { ProductModel } from '../model/product.model';
import { environment } from 'src/environments/environment';
import { SwiperService } from '../service/swiper.service';
import { ActivatedRoute, Router } from '@angular/router';

declare var initSlider: any;  // Khai báo jQuery

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit ,  AfterViewInit {
  @ViewChild('anchor', { static: false }) anchor!: ElementRef;

  items$: Observable<ProductResponseModel>;
  items: ProductModel[] = [];
  page = 0;
  len = 24;
  loading = false; // Trạng thái đang tải
  apiUrl = environment.apiUrl;

  observer!: IntersectionObserver;
  constructor(private productStore: Store<ProductState>
    , private _swiperService: SwiperService ,
     private router: Router) {
    this.items$ = this.productStore.select(getProducts);
  }
  ngOnInit(): void {
    setTimeout(() => {
      initSlider()
    }, 500);
    this.loadProduct();
    this.items$.subscribe((res) => {
      if (res && res.products.length) {
        this.items = [...this.items, ...res.products];
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  loadProduct(): void {
    this.loading = true;
    this.productStore.dispatch(
      productAction({
        params: {
          page: this.page,
          len: this.len,
        },
      })
    );
  }

  setupObserver(): void {
    const options = {
      root: null,
      threshold: 0.1,
    };
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loading) {
        this.page++;
        this.loadProduct();
      }
    }, options);
    this.observer.observe(this.anchor.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  async handleLink(item: ProductModel) {
    try {
      if (!item?.id) {
        return;
      }
      await this.router.navigate(["/du-an/chi-tiet/", item.id]);
    } catch (error) {
    } finally {
    }
  }
}
